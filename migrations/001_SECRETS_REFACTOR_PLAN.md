# 🔒 API Key & Secrets Management Refactor — Implementation Plan

## Executive Summary

Migrate **all** sensitive API keys/tokens from the `businesses` table to a dedicated `business_secrets` table with Supabase Vault encryption at rest, strict RLS, and a `SECURITY DEFINER` RPC for server-side access.

---

## Phase 1: Audit Results (Complete)

### Sensitive Columns Currently in `businesses` Table

| Column | Used By |
|---|---|
| `gemini_api_key` | mayaService.js, adService.js, systemRoutes.js, backend_server.js, useOnboardingStore.ts, ApiValidationSettings.jsx, owner-settings/index.jsx |
| `grok_api_key` | adService.js, systemRoutes.js, backend_server.js, ApiValidationSettings.jsx, owner-settings/index.jsx |
| `claude_api_key` | mayaService.js, backend_server.js, ApiValidationSettings.jsx |
| `youtube_api_key` | backend_server.js, YouTubeService.ts, ApiValidationSettings.jsx |
| `kling_access_key` | klingRoutes.js, ApiValidationSettings.jsx |
| `kling_secret_key` | klingRoutes.js, ApiValidationSettings.jsx |
| `global_sms_api_key` | backend_server.js (SMS send), ApiValidationSettings.jsx |
| `whatsapp_api_key` | backend_server.js, ApiValidationSettings.jsx |
| `google_access_token` | SECURE_TOKENS_MIGRATION.sql, google-auth/index.ts (already migrated) |
| `google_refresh_token` | SECURE_TOKENS_MIGRATION.sql, google-auth/index.ts (already migrated) |
| `google_token_expiry` | SECURE_TOKENS_MIGRATION.sql, google-auth/index.ts (already migrated) |
| `google_drive_folder_id` | SECURE_TOKENS_MIGRATION.sql, google-auth/index.ts (already migrated) |

### Files That Need Updating

#### Backend Services (Node.js)

1. `backend/services/mayaService.js` — `getProviderKey()` function
2. `backend/services/adService.js` — `getBusinessApiKeys()` function
3. `backend/api/klingRoutes.js` — Kling key fetching in 2 routes
4. `frontend_source/backend_server.js` — `getYouTubeApiKey()`, `/api/sms/send`, `/api/system/validate-integrations`

#### Frontend Components (React)

5. `frontend_source/src/components/settings/ApiValidationSettings.jsx` — `fetchKeys()`, `handleFieldSave()`
2. `frontend_source/src/pages/owner-settings/index.jsx` — `fetchData()`, `handleSaveGemini()`, `handleSaveGrok()`
3. `frontend_source/src/pages/onboarding/store/useOnboardingStore.ts` — `initSession()`, `setGeminiApiKey()`

#### Electron Services

8. `frontend_source/electron/main/YouTubeService.ts` — `fetchApiKey()`, `setupRealtimeWatcher()`

#### Supabase Edge Functions

9. `supabase/functions/google-auth/index.ts` — Already uses `business_secrets` ✅ (but needs schema expansion)

#### Dexie.js (Client DB)

10. `frontend_source/src/db/database.js` — `businesses` table schema does NOT index secrets ✅ (no change needed)

---

## Phase 2: Database Migration

### Step 2a: Expand `business_secrets` Table

The table already exists with Google token columns. We need to **add** the remaining secret columns.

**File:** `migrations/002_expand_business_secrets.sql`

### Step 2b: Migrate Data

Copy all existing secret values from `businesses` to `business_secrets`.

### Step 2c: Enable Supabase Vault Encryption

Encrypt columns at rest using `pgsodium` transparent column encryption (TCE).

### Step 2d: Apply RLS Policies

- Service role: full access
- Authenticated users: read/write only their own business's secrets
- Anon: no access

### Step 2e: Create SECURITY DEFINER RPC

A PostgreSQL function that server-side code can use to safely fetch secrets.

### Step 2f: Drop Columns from `businesses`

After all consumers are updated and tested, drop the sensitive columns.

---

## Phase 3: Codebase Updates

### 3a: Create Shared Data Access Layer

Create a new `backend/services/secretsService.js` module that centralizes all secret fetching logic.

### 3b: Update Backend Services

Update each service to use `secretsService` instead of querying `businesses` directly.

### 3c: Update Frontend Components

Frontend components that read/write API keys should use `business_secrets` directly via Supabase client (subject to RLS).

### 3d: Update Electron Services

YouTubeService needs to watch `business_secrets` instead of `businesses`.

---

## Phase 4: Testing

- Verify all backend services can fetch keys from `business_secrets`
- Verify frontend settings page reads/writes correctly
- Verify onboarding store can set/get Gemini key
- Verify RLS prevents cross-business access
- Verify `businesses` query no longer returns secret columns

---

## File Manifest

| File | Purpose |
|---|---|
| `migrations/001_SECRETS_REFACTOR_PLAN.md` | This plan |
| `migrations/002_expand_business_secrets.sql` | DDL migration |
| `migrations/003_migrate_data_and_encrypt.sql` | Data migration + Vault |
| `migrations/004_rls_and_rpc.sql` | RLS policies + RPC |
| `migrations/005_drop_columns.sql` | Drop old columns (run LAST) |
| `backend/services/secretsService.js` | New shared data access layer |
| Updated service files | See Phase 3 |
