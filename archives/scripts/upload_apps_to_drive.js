import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'drive-token.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];

const TARGET_FOLDER_ID = '1dGrIk2VzyaN2hVR_2VW3ev1rB9-fctz-';

const APPS_FOLDER_NAME = 'RanTunes_Apps';

const FILES_TO_UPLOAD = [
    'RanTunes/client/dist_electron/RanTunes-1.5.1-arm64.AppImage',
    'RanTunes/client/dist_electron/RanTunes Setup 1.5.1.exe',
    'RanTunes/client/dist_electron/RanTunes-1.5.1-arm64.dmg'
];

async function authorize() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oAuth2Client.setCredentials(token);

        if (token.expiry_date && token.expiry_date < Date.now()) {
            console.log('🔄 Refreshing token...');
            const newToken = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(newToken.credentials);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify({ ...token, ...newToken.credentials }));
        }
        return oAuth2Client;
    }
    throw new Error('No token found. Please run an auth script first.');
}

async function findOrCreateFolder(drive, folderName, parentId) {
    const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const response = await drive.files.list({ q: query, fields: 'files(id, name)' });
    if (response.data.files.length > 0) return response.data.files[0].id;

    const folder = await drive.files.create({
        requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
        fields: 'id'
    });
    console.log(`📁 Created folder: ${folderName}`);
    return folder.data.id;
}

async function findExistingFile(drive, fileName, folderId) {
    const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
    const response = await drive.files.list({ q: query, fields: 'files(id, name)' });
    return response.data.files.length > 0 ? response.data.files[0].id : null;
}

async function uploadFile(drive, localPath, targetFolderId) {
    const fileName = path.basename(localPath);
    const filePath = path.join(__dirname, localPath);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${localPath}`);
        return null;
    }

    const existingFileId = await findExistingFile(drive, fileName, targetFolderId);
    const media = { body: fs.createReadStream(filePath) };

    if (existingFileId) {
        console.log(`   🔄 Updating existing: ${fileName}`);
        const response = await drive.files.update({
            fileId: existingFileId,
            media: media,
            fields: 'id, name, webViewLink'
        });
        return response.data;
    } else {
        console.log(`   ✅ Creating new: ${fileName}`);
        const response = await drive.files.create({
            requestBody: { name: fileName, parents: [targetFolderId] },
            media: media,
            fields: 'id, name, webViewLink'
        });
        return response.data;
    }
}

async function main() {
    console.log('🚀 Uploading RanTunes Desktop Apps to Google Drive...\n');

    try {
        const auth = await authorize();
        const drive = google.drive({ version: 'v3', auth });
        console.log('✅ Authenticated\n');

        const appsFolderId = await findOrCreateFolder(drive, APPS_FOLDER_NAME, TARGET_FOLDER_ID);

        for (const fileRelativePath of FILES_TO_UPLOAD) {
            console.log(`📤 ${fileRelativePath}`);
            const result = await uploadFile(drive, fileRelativePath, appsFolderId);
            if (result) {
                console.log(`   🔗 URL: ${result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`}`);
            }
        }
        console.log('\n🏁 Upload complete!');
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

main();
