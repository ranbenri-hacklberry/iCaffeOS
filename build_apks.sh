#!/bin/bash

# Configuration and build script for iCaffeOS apps (POS & Loyalty)
# Usage: ./build_apks.sh [pos|loyalty]

set -e

APP_TYPE=$1

if [ "$APP_TYPE" != "pos" ] && [ "$APP_TYPE" != "loyalty" ]; then
  echo "Usage: ./build_apks.sh [pos|loyalty]"
  exit 1
fi

echo "=========================================="
echo "Building iCaffeOS App Target: ${APP_TYPE}"
echo "=========================================="

# 1. Clean previous build outputs
echo "Cleaning old build files..."
rm -rf frontend_source/dist

# 2. Update Android app name in strings.xml and package name in capacitor.config.json
STRINGS_FILE="frontend_source/android/app/src/main/res/values/strings.xml"
CAPACITOR_CONFIG="frontend_source/capacitor.config.json"

if [ "$APP_TYPE" == "pos" ]; then
  echo "Configuring for POS App..."
  # Set App Name to "iCaffeOS"
  sed -i '' 's/<string name="app_name">.*<\/string>/<string name="app_name">iCaffeOS<\/string>/g' "$STRINGS_FILE"
  # Set Capacitor Config appId to com.icaffeos.posnew
  sed -i '' 's/"appId": "[^"]*"/"appId": "com.icaffeos.posnew"/g' "$CAPACITOR_CONFIG"
  sed -i '' 's/"appName": "[^"]*"/"appName": "iCaffeOS"/g' "$CAPACITOR_CONFIG"
  # Set Android applicationId in build.gradle to com.icaffeos.posnew
  sed -i '' 's/applicationId "[^"]*"/applicationId "com.icaffeos.posnew"/g' "frontend_source/android/app/build.gradle"
  
  # Copy POS Launcher Icons
  echo "Copying POS Launcher Icons..."
  rm -rf frontend_source/android/app/src/main/res
  cp -R frontend_source/android/app/src/main/res_pos frontend_source/android/app/src/main/res
  
  # Build POS Web Assets
  echo "Compiling POS Frontend..."
  # Move heavy assets temporarily to optimize APK size
  mv frontend_source/public/cafe-images ./cafe-images-temp || true
  mv frontend_source/public/cafe-images-inspection ./cafe-images-inspection-temp || true
  
  (cd frontend_source && npm run build)
  
  # Restore heavy assets
  mv ./cafe-images-temp frontend_source/public/cafe-images || true
  mv ./cafe-images-inspection-temp frontend_source/public/cafe-images-inspection || true
  
  APK_NAME="icaffeos-pos-v5.0.4.apk"
  REMOTE_FILENAME="icaffeos.apk"
else
  echo "Configuring for Loyalty App..."
  # Set App Name to "iCaffeOS Loyalty"
  sed -i '' 's/<string name="app_name">.*<\/string>/<string name="app_name">iCaffeOS Loyalty<\/string>/g' "$STRINGS_FILE"
  # Set Capacitor Config appId to com.icaffeos.loyalty
  sed -i '' 's/"appId": "[^"]*"/"appId": "com.icaffeos.loyalty"/g' "$CAPACITOR_CONFIG"
  sed -i '' 's/"appName": "[^"]*"/"appName": "iCaffeOS Loyalty"/g' "$CAPACITOR_CONFIG"
  # Set Android applicationId in build.gradle to com.icaffeos.loyalty
  sed -i '' 's/applicationId "[^"]*"/applicationId "com.icaffeos.loyalty"/g' "frontend_source/android/app/build.gradle"
  
  # Copy Loyalty Launcher Icons
  echo "Copying Loyalty (Stampa) Launcher Icons..."
  rm -rf frontend_source/android/app/src/main/res
  cp -R frontend_source/android/app/src/main/res_stampa frontend_source/android/app/src/main/res
  
  # Build Loyalty Web Assets
  echo "Compiling Loyalty Portal Frontend..."
  # Move heavy assets temporarily to optimize APK size
  mv frontend_source/public/cafe-images ./cafe-images-temp || true
  mv frontend_source/public/cafe-images-inspection ./cafe-images-inspection-temp || true
  
  (cd frontend_source && npm run build:loyalty)
  
  # Restore heavy assets
  mv ./cafe-images-temp frontend_source/public/cafe-images || true
  mv ./cafe-images-inspection-temp frontend_source/public/cafe-images-inspection || true
  
  APK_NAME="icaffeos-loyalty-v5.0.4.apk"
  REMOTE_FILENAME="loyalty.apk"
fi

# 3. Synchronize assets to Capacitor Android folder
echo "Syncing Capacitor assets..."
(cd frontend_source && npx cap sync android)

# 4. Compile the Android APK
echo "Compiling Android APK..."
mv frontend_source/android/app/google-services.json ./google-services-temp.json || true
(cd frontend_source/android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew assembleDebug)
mv ./google-services-temp.json frontend_source/android/app/google-services.json || true

# 5. Move APK to Desktop
DESKTOP_PATH="/Users/user/Desktop/${APK_NAME}"
echo "Copying compiled APK to Desktop: ${DESKTOP_PATH}"
rm -f "${DESKTOP_PATH}"
cp frontend_source/android/app/build/outputs/apk/debug/app-debug.apk "${DESKTOP_PATH}"

# 6. Upload APK to remote server static dist folder
SERVER_IP="100.67.107.59"
if ping -c 1 -W 1 192.168.1.10 > /dev/null 2>&1; then
  echo "⚡ Direct local network detected. Using local IP 192.168.1.10 for ultra-fast transfer."
  SERVER_IP="192.168.1.10"
else
  echo "🌐 Local network unreachable. Routing transfer via Tailscale IP 100.67.107.59."
fi

REMOTE_PATH="/Users/icaffeos/icaffeos/frontend_source/dist/${REMOTE_FILENAME}"
echo "Copying to remote server dist folder: ${REMOTE_PATH} on ${SERVER_IP}"
expect -c "
set timeout 300
spawn rsync -avz --progress frontend_source/android/app/build/outputs/apk/debug/app-debug.apk icaffeos@${SERVER_IP}:${REMOTE_PATH}
expect \"*assword:*\" { send \"1771\r\" }
expect eof
"

echo "=========================================="
echo "Successfully built and deployed ${APP_TYPE}!"
echo "APK is available locally at: ${DESKTOP_PATH}"
echo "And remotely at:"
if [ "$APP_TYPE" == "pos" ]; then
  echo "- Local: http://192.168.1.10:4028/icaffeos.apk"
  echo "- Remote: https://icaffeos.tail9a5357.ts.net/icaffeos.apk"
else
  echo "- Local: http://192.168.1.10:4028/loyalty.apk"
  echo "- Remote: https://icaffeos.tail9a5357.ts.net/loyalty.apk"
fi
echo "=========================================="
