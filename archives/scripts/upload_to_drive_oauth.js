#!/usr/bin/env node

/**
 * Upload Project to Google Drive using OAuth
 * This uses your personal Google account instead of a service account
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OAuth2 Credentials (create these at https://console.cloud.google.com/apis/credentials)
const CLIENT_ID = ''; // You'll need to fill this
const CLIENT_SECRET = ''; // You'll need to fill this
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(__dirname, 'drive-token.json');
const TARGET_FOLDER_ID = '1dGrIk2VzyaN2hVR_2VW3ev1rB9-fctz-';

// Files to exclude
const EXCLUDE_PATTERNS = [
    'node_modules', '.git', 'dist', 'build', '.env', '.env.local',
    'service-account.json', 'temp_uploads', 'encrypted_music_output',
    'package-lock.json', '.DS_Store', 'github_comparison', 'drive-token.json'
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

// Create OAuth2 client
function getOAuth2Client() {
    return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

// Get stored token or create new one
async function authorize() {
    const oAuth2Client = getOAuth2Client();

    // Check if we have a stored token
    try {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oAuth2Client.setCredentials(token);
        return oAuth2Client;
    } catch (err) {
        return getNewToken(oAuth2Client);
    }
}

// Get new token by having user authorize
function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('🔐 Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return reject(err);
                oAuth2Client.setCredentials(token);
                // Store the token
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                console.log('✅ Token stored to', TOKEN_PATH);
                resolve(oAuth2Client);
            });
        });
    });
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
        console.error(`❌ Error uploading ${fileName}:`, error.message);
        return null;
    }
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

async function uploadProjectStructure(drive, basePath, files, targetFolderId) {
    const folderCache = new Map();
    folderCache.set('', targetFolderId);

    let uploadCount = 0;
    let errorCount = 0;

    console.log(`\n🚀 Starting upload of ${files.length} files...\n`);

    for (const filePath of files) {
        const relativePath = path.relative(basePath, filePath);
        const dirPath = path.dirname(relativePath);

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
                        const folderId = await createFolder(drive, folder, parentId);
                        folderCache.set(currentPath, folderId);
                        console.log(`📁 Created: ${currentPath}`);
                    } catch (error) {
                        errorCount++;
                        continue;
                    }
                }
                currentParentId = folderCache.get(currentPath);
            }
        }

        console.log(`📤 [${uploadCount + errorCount + 1}/${files.length}] ${relativePath}`);
        const result = await uploadFile(drive, filePath, currentParentId);

        if (result) {
            uploadCount++;
            console.log(`   ✅ ${result.name}`);
        } else {
            errorCount++;
        }
    }

    console.log(`\n🏁 Upload complete!`);
    console.log(`   ✅ Successful: ${uploadCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
}

async function main() {
    console.log('🔧 Initializing Google Drive upload with OAuth...\n');

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('❌ Missing OAuth credentials!');
        console.log('\n📝 To set up OAuth:');
        console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
        console.log('2. Create OAuth 2.0 Client ID (Desktop app)');
        console.log('3. Download the JSON and copy CLIENT_ID and CLIENT_SECRET');
        console.log('4. Edit this file and paste them at the top\n');
        process.exit(1);
    }

    try {
        const auth = await authorize();
        const drive = google.drive({ version: 'v3', auth });

        console.log('✅ Authenticated with Google Drive\n');

        const projectRoot = __dirname;
        const allFiles = getAllFiles(projectRoot);

        console.log(`📊 Found ${allFiles.length} files to upload`);

        await uploadProjectStructure(drive, projectRoot, allFiles, TARGET_FOLDER_ID);

        console.log('\n✨ Project backup complete!');
        console.log(`🔗 View at: https://drive.google.com/drive/folders/${TARGET_FOLDER_ID}`);

    } catch (error) {
        console.error('💥 Error:', error.message);
        process.exit(1);
    }
}

main();
