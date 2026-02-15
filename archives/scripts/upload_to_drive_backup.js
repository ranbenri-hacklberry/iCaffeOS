#!/usr/bin/env node

/**
 * Upload All Project Files to Google Drive
 * This script uploads the entire project structure to a specified Google Drive folder
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// Google Drive Configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'backend', 'service-account.json');
const TARGET_FOLDER_ID = '1dGrIk2VzyaN2hVR_2VW3ev1rB9-fctz-'; // Project backup folder

// Files and folders to EXCLUDE
const EXCLUDE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.env',
    '.env.local',
    'service-account.json',
    'temp_uploads',
    'encrypted_music_output',
    'package-lock.json',
    '.DS_Store',
    'github_comparison'
];

// Get authenticated Drive client
async function getDriveClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_PATH,
        scopes: SCOPES,
    });

    return google.drive({ version: 'v3', auth });
}

// Check if a path should be excluded
function shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

// Get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);

        if (shouldExclude(fullPath)) {
            return;
        }

        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

// Create a folder in Drive
async function createDriveFolder(drive, folderName, parentId) {
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
        console.log(`📁 Created folder: ${folderName} (${response.data.id})`);
        return response.data.id;
    } catch (error) {
        console.error(`❌ Error creating folder ${folderName}:`, error.message);
        throw error;
    }
}

// Upload a file to Drive
async function uploadFile(drive, filePath, parentId) {
    const fileName = path.basename(filePath);

    const fileMetadata = {
        name: fileName,
        parents: [parentId]
    };

    const media = {
        body: fs.createReadStream(filePath)
    };

    try {
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name'
        });
        return response.data;
    } catch (error) {
        console.error(`❌ Error uploading ${fileName}:`, error.message);
        return null;
    }
}

// Create folder structure and upload files
async function uploadProjectStructure(drive, basePath, files, targetFolderId) {
    const folderCache = new Map();
    folderCache.set('', targetFolderId); // Root is the target folder

    let uploadCount = 0;
    let errorCount = 0;

    console.log(`\n🚀 Starting upload of ${files.length} files...\n`);

    for (const filePath of files) {
        const relativePath = path.relative(basePath, filePath);
        const dirPath = path.dirname(relativePath);

        // Build folder structure
        let currentParentId = targetFolderId;

        if (dirPath !== '.') {
            const folders = dirPath.split(path.sep);
            let currentPath = '';

            for (const folder of folders) {
                const parentPath = currentPath;
                currentPath = currentPath ? path.join(currentPath, folder) : folder;

                if (!folderCache.has(currentPath)) {
                    const parentId = folderCache.get(parentPath) || targetFolderId;
                    try {
                        const folderId = await createDriveFolder(drive, folder, parentId);
                        folderCache.set(currentPath, folderId);
                    } catch (error) {
                        console.error(`Failed to create folder structure for: ${currentPath}`);
                        errorCount++;
                        continue;
                    }
                }
                currentParentId = folderCache.get(currentPath);
            }
        }

        // Upload the file
        console.log(`📤 [${uploadCount + 1}/${files.length}] ${relativePath}`);
        const result = await uploadFile(drive, filePath, currentParentId);

        if (result) {
            uploadCount++;
            console.log(`   ✅ Uploaded: ${result.name}`);
        } else {
            errorCount++;
        }
    }

    console.log(`\n🏁 Upload complete!`);
    console.log(`   ✅ Successful: ${uploadCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📂 Total folders created: ${folderCache.size - 1}`);
}

// Main function
async function main() {
    try {
        console.log('🔧 Initializing Google Drive upload...');
        console.log(`📂 Target Folder ID: ${TARGET_FOLDER_ID}`);

        const drive = await getDriveClient();
        console.log('✅ Drive client authenticated');

        // Get all project files
        const projectRoot = path.resolve(__dirname);
        console.log(`📁 Scanning project from: ${projectRoot}`);

        const allFiles = getAllFiles(projectRoot);
        console.log(`📊 Found ${allFiles.length} files to upload`);

        // Upload everything
        await uploadProjectStructure(drive, projectRoot, allFiles, TARGET_FOLDER_ID);

        console.log('\n✨ Project backup complete!');
        console.log(`🔗 View at: https://drive.google.com/drive/folders/${TARGET_FOLDER_ID}`);

    } catch (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    }
}

main();
