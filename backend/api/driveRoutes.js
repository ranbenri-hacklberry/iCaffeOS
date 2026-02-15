/**
 * Backend API for Google Drive operations
 * Handles upload of invoices and OCR results to Google Drive
 */

import express from 'express';
import { google } from 'googleapis';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    dest: 'temp_uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Google Drive authentication
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'drive-token.json');
const getInvoicesFolderId = () => process.env.DRIVE_INVOICES_FOLDER_ID || '1jtrzxLxdnSqQmKmhZADsnCoabEE4QxMZ';

let driveClient = null;

async function getDriveClient() {
    if (driveClient) return driveClient;

    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.warn('⚠️ credentials.json not found, falling back to service account');
        const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './service-account.json';
        const auth = new google.auth.GoogleAuth({
            keyFile: SERVICE_ACCOUNT_PATH,
            scopes: SCOPES,
        });
        driveClient = google.drive({ version: 'v3', auth });
        return driveClient;
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oAuth2Client.setCredentials(token);

        // Check if session is expired and refresh if possible
        oAuth2Client.on('tokens', (tokens) => {
            if (tokens.refresh_token) {
                // Store updated token
                const currentToken = JSON.parse(fs.readFileSync(TOKEN_PATH));
                fs.writeFileSync(TOKEN_PATH, JSON.stringify({ ...currentToken, ...tokens }));
            }
        });
    } else {
        throw new Error('OAuth token (drive-token.json) not found. Please run the authorization script first.');
    }

    driveClient = google.drive({ version: 'v3', auth: oAuth2Client });
    return driveClient;
}

/**
 * Create folder structure in Drive if it doesn't exist
 */
async function ensureFolderPath(drive, baseFolderId, pathParts) {
    let currentFolderId = baseFolderId;

    for (const folderName of pathParts) {
        // Check if folder exists
        const query = `name='${folderName}' and '${currentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        if (response.data.files.length > 0) {
            currentFolderId = response.data.files[0].id;
        } else {
            // Create folder
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [currentFolderId]
            };

            const folder = await drive.files.create({
                requestBody: folderMetadata,
                fields: 'id'
            });

            currentFolderId = folder.data.id;
        }
    }

    return currentFolderId;
}

/**
 * POST /api/drive/upload-invoice
 * Upload invoice image and OCR results to Google Drive
 */
router.post('/upload-invoice', upload.single('invoice'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { ocrResults, businessId } = req.body;
        const drive = await getDriveClient();

        // Create folder structure: YYYY/MM/DD
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const folderId = getInvoicesFolderId();
        console.log('📂 Using target folder ID:', folderId);

        if (!folderId) {
            throw new Error('DRIVE_INVOICES_FOLDER_ID is missing from environment variables');
        }

        const targetFolderId = await ensureFolderPath(
            drive,
            folderId,
            [year, month, day]
        );

        // Upload image
        const timestamp = now.getTime();
        const fileName = `invoice_${timestamp}_${businessId || 'unknown'}_${req.file.originalname}`;

        const fileMetadata = {
            name: fileName,
            parents: [targetFolderId]
        };

        const media = {
            mimeType: req.file.mimetype,
            body: fs.createReadStream(req.file.path)
        };

        const uploadedFile = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink, webContentLink'
        });

        // Upload OCR results as JSON (if provided)
        let ocrFileId = null;
        if (ocrResults) {
            const ocrFileName = `ocr_${timestamp}.json`;
            const ocrMetadata = {
                name: ocrFileName,
                parents: [targetFolderId],
                mimeType: 'application/json'
            };

            const ocrMedia = {
                mimeType: 'application/json',
                body: JSON.stringify(JSON.parse(ocrResults), null, 2)
            };

            const ocrFile = await drive.files.create({
                requestBody: ocrMetadata,
                media: ocrMedia,
                fields: 'id, name'
            });

            ocrFileId = ocrFile.data.id;
        }

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            file: {
                id: uploadedFile.data.id,
                name: uploadedFile.data.name,
                viewLink: uploadedFile.data.webViewLink,
                downloadLink: uploadedFile.data.webContentLink
            },
            ocrFile: ocrFileId ? { id: ocrFileId } : null,
            folderPath: `${year}/${month}/${day}`,
            uploadedAt: now.toISOString()
        });

    } catch (error) {
        console.error('❌ Drive upload error:', error);

        // Clean up temp file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: 'Failed to upload to Drive',
            message: error.message
        });
    }
});

/**
 * GET /api/drive/invoices/list
 * List recent invoices from Drive
 */
router.get('/invoices/list', async (req, res) => {
    try {
        const { limit = 50, date } = req.query;
        const drive = await getDriveClient();

        let query = `'${INVOICES_FOLDER_ID}' in parents and trashed=false`;

        if (date) {
            // Filter by specific date folder
            const [year, month, day] = date.split('-');
            // This is simplified - in production you'd navigate the folder tree
        }

        const response = await drive.files.list({
            q: query,
            pageSize: parseInt(limit),
            fields: 'files(id, name, createdTime, webViewLink, mimeType)',
            orderBy: 'createdTime desc'
        });

        res.json({
            files: response.data.files,
            count: response.data.files.length
        });

    } catch (error) {
        console.error('❌ Drive list error:', error);
        res.status(500).json({
            error: 'Failed to list invoices',
            message: error.message
        });
    }
});

export default router;
