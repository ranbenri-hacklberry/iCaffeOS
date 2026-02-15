#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'backend', 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TARGET_FOLDER_ID = '1dGrIk2VzyaN2hVR_2VW3ev1rB9-fctz-';

async function uploadZipToDrive(zipFilePath) {
    console.log('🔧 Initializing Google Drive...');

    const auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_PATH,
        scopes: SCOPES,
    });

    const drive = google.drive({ version: 'v3', auth });

    const fileName = path.basename(zipFilePath);
    const fileSize = fs.statSync(zipFilePath).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

    console.log(`📦 Uploading: ${fileName} (${fileSizeMB} MB)`);
    console.log(`📂 Target folder: ${TARGET_FOLDER_ID}`);

    const fileMetadata = {
        name: fileName,
        parents: [TARGET_FOLDER_ID]
    };

    const media = {
        body: fs.createReadStream(zipFilePath)
    };

    try {
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink'
        });

        console.log('\n✅ Upload successful!');
        console.log(`📄 File: ${response.data.name}`);
        console.log(`🔗 Link: ${response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`}`);

    } catch (error) {
        console.error('\n❌ Upload failed:', error.message);
        throw error;
    }
}

// Find the latest ZIP file
const files = fs.readdirSync(__dirname);
const zipFiles = files.filter(f => f.startsWith('project_backup_') && f.endsWith('.zip'));

if (zipFiles.length === 0) {
    console.error('❌ No backup ZIP file found!');
    process.exit(1);
}

const latestZip = zipFiles.sort().reverse()[0];
const zipPath = path.join(__dirname, latestZip);

uploadZipToDrive(zipPath).catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
