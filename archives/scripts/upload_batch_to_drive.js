#!/usr/bin/env node

/**
 * Upload Project Files to Google Drive in Batches
 * Uploads 100 files at a time to avoid quota issues
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'backend', 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TARGET_FOLDER_ID = '1dGrIk2VzyaN2hVR_2VW3ev1rB9-fctz-';
const BATCH_SIZE = 100;
const PROGRESS_FILE = path.join(__dirname, '.drive_upload_progress.json');

// Files to exclude
const EXCLUDE_PATTERNS = [
    'node_modules', '.git', 'dist', 'build', '.env', '.env.local',
    'service-account.json', 'temp_uploads', 'encrypted_music_output',
    'package-lock.json', '.DS_Store', 'github_comparison', 'drive-token.json',
    '.drive_upload_progress.json', 'project_backup_'
];

function shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (shouldExclude(fullPath)) return;
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });
    return arrayOfFiles;
}

async function getDriveClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_PATH,
        scopes: SCOPES,
    });
    return google.drive({ version: 'v3', auth });
}

async function createFolder(drive, folderName, parentId) {
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
    };

    try {
        const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, name'
        });
        return response.data.id;
    } catch (error) {
        console.error(`❌ Error creating folder ${folderName}:`, error.message);
        throw error;
    }
}

async function uploadFile(drive, filePath, parentId) {
    const fileName = path.basename(filePath);
    const fileMetadata = { name: fileName, parents: [parentId] };
    const media = { body: fs.createReadStream(filePath) };

    try {
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name'
        });
        return response.data;
    } catch (error) {
        console.error(`   Error: ${error.message}`);
        return null;
    }
}

function loadProgress() {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        }
    } catch (err) {
        console.warn('⚠️ Could not load progress file, starting fresh');
    }
    return { uploadedFiles: [], folderCache: {} };
}

function saveProgress(progress) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function uploadBatch(drive, files, basePath, targetFolderId, startIndex, progress) {
    const endIndex = Math.min(startIndex + BATCH_SIZE, files.length);
    const batch = files.slice(startIndex, endIndex);

    console.log(`\n📦 Uploading batch ${Math.floor(startIndex / BATCH_SIZE) + 1}`);
    console.log(`   Files ${startIndex + 1} to ${endIndex} of ${files.length}\n`);

    const folderCache = new Map(Object.entries(progress.folderCache || {}));
    folderCache.set('', targetFolderId);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < batch.length; i++) {
        const filePath = batch[i];
        const relativePath = path.relative(basePath, filePath);

        // Skip if already uploaded
        if (progress.uploadedFiles.includes(relativePath)) {
            console.log(`⏭️  [${startIndex + i + 1}/${files.length}] Already uploaded: ${relativePath}`);
            successCount++;
            continue;
        }

        const dirPath = path.dirname(relativePath);
        let currentParentId = targetFolderId;

        // Build folder structure
        if (dirPath !== '.') {
            const folders = dirPath.split(path.sep);
            let currentPath = '';

            for (const folder of folders) {
                const parentPath = currentPath;
                currentPath = currentPath ? path.join(currentPath, folder) : folder;

                if (!folderCache.has(currentPath)) {
                    const parentId = folderCache.get(parentPath) || targetFolderId;
                    try {
                        const folderId = await createFolder(drive, folder, parentId);
                        folderCache.set(currentPath, folderId);
                        console.log(`📁 Created folder: ${currentPath}`);
                    } catch (error) {
                        errorCount++;
                        continue;
                    }
                }
                currentParentId = folderCache.get(currentPath);
            }
        }

        // Upload file
        console.log(`📤 [${startIndex + i + 1}/${files.length}] ${relativePath}`);
        const result = await uploadFile(drive, filePath, currentParentId);

        if (result) {
            successCount++;
            progress.uploadedFiles.push(relativePath);
            console.log(`   ✅ ${result.name}`);
        } else {
            errorCount++;
            console.log(`   ❌ Failed`);
        }

        // Save progress every 10 files
        if ((i + 1) % 10 === 0) {
            progress.folderCache = Object.fromEntries(folderCache);
            saveProgress(progress);
        }
    }

    // Save final progress
    progress.folderCache = Object.fromEntries(folderCache);
    saveProgress(progress);

    console.log(`\n📊 Batch complete: ✅ ${successCount} | ❌ ${errorCount}`);

    return { successCount, errorCount, hasMore: endIndex < files.length };
}

async function main() {
    console.log('🔧 Initializing batch upload to Google Drive...');
    console.log(`📂 Target Folder ID: ${TARGET_FOLDER_ID}`);
    console.log(`📦 Batch size: ${BATCH_SIZE} files\n`);

    try {
        const drive = await getDriveClient();
        console.log('✅ Drive client authenticated\n');

        const projectRoot = __dirname;
        const allFiles = getAllFiles(projectRoot);
        console.log(`📊 Found ${allFiles.length} files total\n`);

        const progress = loadProgress();
        console.log(`📝 Already uploaded: ${progress.uploadedFiles.length} files\n`);

        const startFrom = progress.uploadedFiles.length;

        if (startFrom >= allFiles.length) {
            console.log('✨ All files already uploaded!');
            console.log(`🔗 View at: https://drive.google.com/drive/folders/${TARGET_FOLDER_ID}`);
            return;
        }

        const result = await uploadBatch(drive, allFiles, projectRoot, TARGET_FOLDER_ID, startFrom, progress);

        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 Overall Progress:`);
        console.log(`   Total files: ${allFiles.length}`);
        console.log(`   Uploaded: ${progress.uploadedFiles.length}`);
        console.log(`   Remaining: ${allFiles.length - progress.uploadedFiles.length}`);
        console.log(`${'='.repeat(60)}\n`);

        if (result.hasMore) {
            console.log('⏸️  Batch complete. Run this script again to continue uploading.');
            console.log('💡 Tip: You can run multiple batches by executing this script repeatedly.\n');
        } else {
            console.log('✨ All files uploaded successfully!');
            console.log(`🔗 View at: https://drive.google.com/drive/folders/${TARGET_FOLDER_ID}\n`);
            // Clean up progress file
            if (fs.existsSync(PROGRESS_FILE)) {
                fs.unlinkSync(PROGRESS_FILE);
            }
        }

    } catch (error) {
        console.error('\n💥 Error:', error.message);

        if (error.message.includes('Service Accounts do not have storage quota')) {
            console.log('\n⚠️  IMPORTANT: You need to share the Drive folder with the service account!');
            console.log('   Email: invoice-backup@repos-477613.iam.gserviceaccount.com');
            console.log('   Role: Editor\n');
        }

        process.exit(1);
    }
}

main();
