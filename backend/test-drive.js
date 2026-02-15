import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

async function testDriveAccess() {
    try {
        console.log('🔧 Testing Google Drive access...\n');

        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        console.log('✅ Service Account authenticated');
        console.log('📁 Testing folder access:', process.env.DRIVE_INVOICES_FOLDER_ID);

        // Try to get folder metadata
        const folder = await drive.files.get({
            fileId: process.env.DRIVE_INVOICES_FOLDER_ID,
            fields: 'id, name, permissions'
        });

        console.log('✅ SUCCESS! Folder access confirmed:');
        console.log('   Name:', folder.data.name);
        console.log('   ID:', folder.data.id);
        console.log('\n🎉 Everything is configured correctly!\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);

        if (error.code === 404) {
            console.log('\n📋 NEXT STEP: Share the folder with the service account');
            console.log('   1. Open: https://drive.google.com/drive/folders/' + process.env.DRIVE_INVOICES_FOLDER_ID);
            console.log('   2. Click "Share"');
            console.log('   3. Add this email: invoice-backup@repos-477613.iam.gserviceaccount.com');
            console.log('   4. Give "Editor" permission');
            console.log('   5. Click "Send"\n');
        }
    }
}

testDriveAccess();
