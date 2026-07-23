# 📱 iCaffeOS App Build & Configuration Guide

This document contains the official configuration and build guidelines for the two distinct mobile app targets compiled from this codebase.

## 🎯 Target Apps

| App Target | Purpose | Build Environment Variable | Output Local File | Remote Server URL |
|---|---|---|---|---|
| **iCaffeOS POS** | Cashier, KDS, & Store Manager POS system. | *Default* (`npm run build`) | `icaffeos-pos-v5.0.4.apk` | `https://icaffeos.tail9a5357.ts.net/icaffeos.apk` |
| **iCaffeOS Loyalty** | Client-facing customer loyalty portal. | `VITE_CUSTOMER_LOYALTY_APP=true` | `icaffeos-loyalty-v5.0.4.apk` | `https://icaffeos.tail9a5357.ts.net/loyalty.apk` |

---

## 🛠️ Unified Build Script

We have created a master build script `build_apks.sh` in the repository root to completely automate clean builds, sync Capacitor, compile Gradle debug builds, copy to the local Desktop, and upload to the remote server.

### How to Build POS App:
```bash
./build_apks.sh pos
```

### How to Build Loyalty App:
```bash
./build_apks.sh loyalty
```

---

## 📝 Manual Steps Summary

If building manually, ensure these configuration files are correctly updated:

### 1. `capacitor.config.json`
* **POS App:**
  ```json
  {
    "appId": "com.icaffeos.app",
    "appName": "iCaffeOS"
  }
  ```
* **Loyalty App:**
  ```json
  {
    "appId": "com.icaffeos.loyalty",
    "appName": "iCaffeOS Loyalty"
  }
  ```

### 2. `strings.xml` (`frontend_source/android/app/src/main/res/values/strings.xml`)
* **POS App:**
  ```xml
  <string name="app_name">iCaffeOS</string>
  ```
* **Loyalty App:**
  ```xml
  <string name="app_name">iCaffeOS Loyalty</string>
  ```
