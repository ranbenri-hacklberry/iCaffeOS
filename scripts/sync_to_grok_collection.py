import os
import requests
import json

# Configuration
COLLECTION_ID = "collection_b1470bb9-6e71-4f10-91fa-73edd1377bc2"
# These will be provided by GitHub Secrets
MANAGEMENT_KEY = os.getenv("GROK_MANAGEMENT_KEY")
API_KEY = os.getenv("GROK_API_KEY")

def upload_and_map(path):
    """Verified two-step process to upload and sync to collection"""
    try:
        # Step 1: Upload file to storage
        url_files = "https://api.x.ai/v1/files"
        headers_api = {"Authorization": f"Bearer {API_KEY}"}
        
        with open(path, "rb") as f:
            files = {"file": (os.path.basename(path), f)}
            r1 = requests.post(url_files, headers=headers_api, files=files)
            
        if r1.status_code != 200:
            print(f"❌ Error uploading {path} to storage: {r1.text}")
            return False
            
        file_id = r1.json().get("id")
        print(f"   Uploaded {path} -> {file_id}")

        # Step 2: Add document to collection mapping
        url_mgmt = f"https://management-api.x.ai/v1/collections/{COLLECTION_ID}/documents/{file_id}"
        headers_mgmt = {
            "Authorization": f"Bearer {MANAGEMENT_KEY}",
            "Content-Type": "application/json"
        }
        r2 = requests.post(url_mgmt, headers=headers_mgmt, json={})
        
        # API returns empty JSON {} on success
        if r2.status_code == 200 or r2.text == "{}":
            print(f"✅ Successfully added {path} to collection")
            return True
        else:
            print(f"❌ Error mapping {path} to collection: {r2.text}")
            return False
            
    except Exception as e:
        print(f"🚨 Exception processing {path}: {str(e)}")
        return False

def sync_project():
    valid_extensions = ('.js', '.jsx', '.ts', '.tsx', '.json', '.sql', '.md')
    exclude_files = ['package-lock.json', 'upload_all_project_files.sh', 'upload_kanban_files.sh']
    
    # 1. Sync recursive src folder
    for root, _, files in os.walk("frontend_source/src"):
        for file in files:
            if file.endswith(valid_extensions) and file not in exclude_files:
                path = os.path.join(root, file)
                upload_and_map(path)
                
    # 2. Sync root files
    for file in os.listdir('.'):
        if os.path.isfile(file) and file.endswith(valid_extensions) and file not in exclude_files:
            upload_and_map(file)

if __name__ == "__main__":
    if not MANAGEMENT_KEY or not API_KEY:
        print("❌ Missing environment variables GROK_MANAGEMENT_KEY or GROK_API_KEY")
    else:
        print(f"🚀 Starting sync to Grok collection: {COLLECTION_ID}")
        sync_project()
        print("🏁 Sync complete!")
