#!/usr/bin/env python3
"""
Upload project files to Google Drive using OAuth
Simple setup - just run and authorize once
"""

import os
import pickle
from pathlib import Path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Scopes
SCOPES = ['https://www.googleapis.com/auth/drive.file']
TARGET_FOLDER_ID = '1dGrIk2VzyaN2hVR_2VW3ev1rB9-fctz-'

# Patterns to exclude
EXCLUDE_PATTERNS = [
    'node_modules', '.git', 'dist', 'build', '.env', 'service-account.json',
    'temp_uploads', 'encrypted_music_output', 'package-lock.json', '.DS_Store',
    'github_comparison', 'drive-token', 'project_backup_', 'token.pickle',
    '.drive_upload_progress'
]

def should_exclude(path_str):
    return any(pattern in path_str for pattern in EXCLUDE_PATTERNS)

def get_credentials():
    """Get OAuth credentials - opens browser once for auth"""
    creds = None
    token_path = Path('token.pickle')
    
    # Check for existing token
    if token_path.exists():
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)
    
    # If no valid credentials, let user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Need to create OAuth credentials first
            print("⚠️  First time setup:")
            print("1. Go to: https://console.cloud.google.com/apis/credentials")
            print("2. Create 'OAuth 2.0 Client ID' (Desktop app)")
            print("3. Download JSON and save as 'credentials.json' here")
            print()
            
            if not Path('credentials.json').exists():
                print("❌ Missing credentials.json file!")
                print("Please follow the steps above and run again.")
                exit(1)
            
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save credentials for next run
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)
    
    return creds

def create_folder(service, name, parent_id):
    """Create a folder in Drive"""
    file_metadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [parent_id]
    }
    
    folder = service.files().create(
        body=file_metadata,
        fields='id'
    ).execute()
    
    return folder.get('id')

def upload_file(service, file_path, parent_id):
    """Upload a file to Drive"""
    file_name = os.path.basename(file_path)
    file_metadata = {
        'name': file_name,
        'parents': [parent_id]
    }
    
    media = MediaFileUpload(file_path, resumable=True)
    
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()
    
    return file.get('id')

def get_all_files(root_dir):
    """Get all project files"""
    files = []
    for path in Path(root_dir).rglob('*'):
        if path.is_file() and not should_exclude(str(path)):
            files.append(path)
    return files

def main():
    print("🚀 Uploading project to Google Drive with OAuth\n")
    
    # Authenticate
    print("🔐 Authenticating...")
    creds = get_credentials()
    service = build('drive', 'v3', credentials=creds)
    print("✅ Authenticated!\n")
    
    # Get all files
    project_root = Path(__file__).parent
    all_files = get_all_files(project_root)
    print(f"📊 Found {len(all_files)} files to upload\n")
    
    # Track folders
    folder_cache = {'': TARGET_FOLDER_ID}
    
    # Upload files
    uploaded = 0
    failed = 0
    
    for i, file_path in enumerate(all_files, 1):
        relative_path = file_path.relative_to(project_root)
        dir_path = relative_path.parent
        
        # Create folder structure
        current_parent = TARGET_FOLDER_ID
        if str(dir_path) != '.':
            parts = dir_path.parts
            current_path = ''
            
            for part in parts:
                parent_path = current_path
                current_path = os.path.join(current_path, part) if current_path else part
                
                if current_path not in folder_cache:
                    parent_id = folder_cache.get(parent_path, TARGET_FOLDER_ID)
                    try:
                        folder_id = create_folder(service, part, parent_id)
                        folder_cache[current_path] = folder_id
                        print(f"📁 Created: {current_path}")
                    except Exception as e:
                        print(f"❌ Folder error: {e}")
                        continue
                
                current_parent = folder_cache[current_path]
        
        # Upload file
        print(f"📤 [{i}/{len(all_files)}] {relative_path}")
        try:
            upload_file(service, str(file_path), current_parent)
            uploaded += 1
            print(f"   ✅ Uploaded")
        except Exception as e:
            failed += 1
            print(f"   ❌ Failed: {e}")
        
        # Progress checkpoint every 50 files
        if i % 50 == 0:
            print(f"\n📊 Progress: {uploaded} uploaded, {failed} failed\n")
    
    print(f"\n{'='*60}")
    print(f"✨ Upload complete!")
    print(f"   ✅ Successful: {uploaded}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📁 Total folders: {len(folder_cache) - 1}")
    print(f"{'='*60}\n")
    print(f"🔗 View at: https://drive.google.com/drive/folders/{TARGET_FOLDER_ID}")
    
    # Send SMS notification
    print("\n📱 Sending SMS notification...")
    try:
        import requests
        sms_response = requests.post(
            'https://us-central1-repos-477613.cloudfunctions.net/sendSms',
            json={
                'phone': '0548317887',
                'message': f'✅ העלאה ל-Drive הושלמה!\n📊 {uploaded} קבצים הועלו בהצלחה\n🔗 הקבצים זמינים ב-Drive'
            },
            headers={'Content-Type': 'application/json'}
        )
        if sms_response.ok:
            print("✅ SMS sent successfully!")
        else:
            print(f"⚠️ SMS failed: {sms_response.status_code}")
    except Exception as e:
        print(f"⚠️ Could not send SMS: {e}")

if __name__ == '__main__':
    main()
