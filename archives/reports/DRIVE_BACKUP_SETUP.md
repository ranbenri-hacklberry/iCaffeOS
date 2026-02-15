# 🔧 Google Drive Backup Setup Guide

## Overview

All scanned invoices are automatically backed up to your Google Drive in organized folders by date.

## 📁 Folder Structure

```
Google Drive/
└── Invoices/
    └── 2026/
        └── 01/
            └── 02/
                ├── invoice_1704195600000_restaurant_invoice.jpg
                └── ocr_1704195600000.json
```

## 🚀 Setup Instructions

### Step 1: Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google Drive API**
4. Go to **IAM & Admin** → **Service Accounts**
5. Click **Create Service Account**
6. Name it: `invoice-backup-service`
7. Click **Create and Continue**
8. Skip role assignment (optional)
9. Click **Done**

### Step 2: Generate Service Account Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** → **Create New Key**
4. Choose **JSON** format
5. Download the key file
6. **IMPORTANT**: Keep this file secure! Don't commit to Git!

### Step 3: Share Drive Folder with Service Account

1. In Google Drive, create a folder called `Invoices`
2. Right-click → **Share**
3. Copy the **service account email** from the JSON file
   - It looks like: `invoice-backup-service@project-id.iam.gserviceaccount.com`
4. Paste it in the share dialog
5. Give it **Editor** permission
6. Click **Send**
7. Copy the **Folder ID** from the URL
   - URL format: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

### Step 4: Configure Backend

1. Place the downloaded JSON file in your backend directory:

   ```bash
   cp ~/Downloads/service-account-key.json ./backend/service-account.json
   ```

2. Add to `.gitignore`:

   ```
   backend/service-account.json
   *.json
   !package.json
   ```

3. Set environment variables in `backend/.env`:

   ```bash
   GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json
   DRIVE_INVOICES_FOLDER_ID=YOUR_FOLDER_ID_FROM_STEP_3
   ```

4. Install dependencies:

   ```bash
   cd backend
   npm install googleapis multer
   ```

### Step 5: Update Backend Server

Add the Drive routes to your Express server:

```javascript
// backend/server.js or backend/index.js
import driveRoutes from './api/driveRoutes.js';

// ... existing code ...

app.use('/api/drive', driveRoutes);
```

### Step 6: Configure Frontend

Add to `frontend_source/.env.local`:

```bash
VITE_API_URL=http://localhost:3001
```

## 🧪 Testing

1. Start your backend:

   ```bash
   cd backend
   npm start
   ```

2. Start your frontend:

   ```bash
   cd frontend_source
   npm run dev
   ```

3. Go to Inventory → Click "סרוק חשבונית"
4. Upload an invoice
5. Check your Google Drive folder!

## ✅ Verification

After scanning an invoice, you should see:

- ✅ Console log: `"✅ Invoice uploaded to Drive: ..."`
- ✅ File appears in Drive folder
- ✅ OCR JSON file in same folder

## 🚨 Troubleshooting

### "Failed to upload to Drive"

- Check service account JSON path
- Verify folder ID is correct
- Ensure service account has Editor permission

### "Authentication failed"

- Re-download service account key
- Check JSON file is valid
- Verify Google Drive API is enabled

### "Folder not found"

- Double-check DRIVE_INVOICES_FOLDER_ID
- Make sure you shared the folder with service account email
- Try using the root folder ID first for testing

## 📊 Storage Usage

With 2TB storage:

- Average invoice image: 2-5MB
- Average OCR JSON: 5-20KB
- **Estimated capacity**: 400,000+ invoices

## 🔐 Security Notes

1. **Never commit** `service-account.json` to Git
2. Keep service account permissions **minimal** (only Drive access)
3. Regularly **rotate** service account keys
4. Use **environment variables** for configuration

## 🎯 What's Backed Up

Each scan creates:

1. **Original image** - Full resolution invoice photo
2. **OCR results** - JSON with:
   - Extracted items & prices
   - Total amount
