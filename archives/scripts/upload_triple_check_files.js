#!/usr/bin/env node

/**
 * Upload specific project files to Google Drive iCaffeOS_Project folder
 * Uses OAuth credentials (credentials.json + token.pickle)
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'drive-token.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];

// iCaffeOS_Project folder ID
const TARGET_FOLDER_ID = '1dGrIk2VzyaN2hVR_2VW3ev1rB9-fctz-';

// Specific files to upload for this version
const FILES_TO_UPLOAD = [
    { local: 'frontend_source/src/pages/kds/components/KDSInventoryScreen.jsx', drive: 'frontend_source/src/pages/kds/components' },
    { local: 'frontend_source/src/components/manager/TripleCheckCard.jsx', drive: 'frontend_source/src/components/manager' },
    { local: 'frontend_source/src/components/ui/SmartStepper.jsx', drive: 'frontend_source/src/components/ui' },
    { local: 'frontend_source/src/hooks/useInvoiceOCR.js', drive: 'frontend_source/src/hooks' },
    { local: 'frontend_source/CHANGELOG.md', drive: 'frontend_source' },
    { local: 'CATALOG_SUPPLIERS_MIGRATION.sql', drive: '' },
];

async function authorize() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have a saved token
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oAuth2Client.setCredentials(token);

        // Refresh token if needed
        if (token.expiry_date && token.expiry_date < Date.now()) {
            console.log('🔄 Refreshing token...');
            const newToken = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(newToken.credentials);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(newToken.credentials));
        }

        return oAuth2Client;
    }

    // Get new token
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('🔐 Authorize this app by visiting this URL:\n');
    console.log(authUrl);
    console.log('');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve, reject) => {
        rl.question('Enter the authorization code from that page: ', async (code) => {
            rl.close();
            try {
                const { tokens } = await oAuth2Client.getToken(code);
                oAuth2Client.setCredentials(tokens);
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
                console.log('✅ Token saved to', TOKEN_PATH);
                resolve(oAuth2Client);
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function findOrCreateFolder(drive, folderName, parentId) {
    // Search for existing folder
    const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
    });

    if (response.data.files.length > 0) {
        return response.data.files[0].id;
    }

    // Create if not exists
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
    };

    const folder = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id'
    });

    console.log(`📁 Created folder: ${folderName}`);
    return folder.data.id;
}

async function ensureFolderPath(drive, baseFolderId, folderPath) {
    if (!folderPath || folderPath === '') return baseFolderId;

    const parts = folderPath.split('/');
    let currentFolderId = baseFolderId;

    for (const part of parts) {
        currentFolderId = await findOrCreateFolder(drive, part, currentFolderId);
    }

    return currentFolderId;
}

async function findExistingFile(drive, fileName, folderId) {
    const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;

    const response = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
    });

    return response.data.files.length > 0 ? response.data.files[0].id : null;
}

async function uploadFile(drive, localPath, targetFolderId) {
    const fileName = path.basename(localPath);
    const filePath = path.join(__dirname, localPath);

    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${localPath}`);
        return null;
    }

    // Check if file exists (for version update)
    const existingFileId = await findExistingFile(drive, fileName, targetFolderId);

    if (existingFileId) {
        // Update existing file (creates new version)
        const media = {
            body: fs.createReadStream(filePath)
        };

        const response = await drive.files.update({
            fileId: existingFileId,
            media: media,
            fields: 'id, name'
        });

        console.log(`   🔄 Updated: ${fileName} (new version)`);
        return response.data;
    } else {
        // Create new file
        const fileMetadata = {
            name: fileName,
            parents: [targetFolderId]
        };

        const media = {
            body: fs.createReadStream(filePath)
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name'
        });

        console.log(`   ✅ Created: ${fileName}`);
        return response.data;
    }
}

async function main() {
    console.log('🚀 Uploading Triple-Check files to Google Drive...\n');
    console.log(`📂 Target: iCaffeOS_Project (${TARGET_FOLDER_ID})\n`);

    try {
        const auth = await authorize();
        const drive = google.drive({ version: 'v3', auth });
        console.log('✅ Authenticated with OAuth\n');

        let successCount = 0;
        let errorCount = 0;

        for (const file of FILES_TO_UPLOAD) {
            try {
                console.log(`📤 ${file.local}`);

                // Ensure folder path exists
                const targetFolderId = await ensureFolderPath(drive, TARGET_FOLDER_ID, file.drive);

                // Upload file
                const result = await uploadFile(drive, file.local, targetFolderId);

                if (result) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                errorCount++;
            }
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log(`📊 Results: ✅ ${successCount} | ❌ ${errorCount}`);
        console.log(`🔗 https://drive.google.com/drive/folders/${TARGET_FOLDER_ID}`);
        console.log(`${'='.repeat(50)}\n`);

    } catch (error) {
        console.error('💥 Error:', error.message);
        process.exit(1);
    }
}

main();
