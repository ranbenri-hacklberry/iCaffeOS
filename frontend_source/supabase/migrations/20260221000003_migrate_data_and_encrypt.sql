-- ============================================================================
-- Migration 003: Migrate Data from businesses to business_secrets + Vault
-- ============================================================================
-- Purpose: Copy all existing API keys/tokens from the businesses table 
--          into business_secrets (UPSERT to handle re-runs safely).
--          Then enable Supabase Vault transparent column encryption (TCE).
-- ============================================================================
-- ═══════════════════════════════════════════════════════════════════════════
-- PART A: Data Migration (Idempotent via ON CONFLICT ... DO UPDATE)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.business_secrets (
        business_id,
        -- Google OAuth (may already exist from prior migration)
        google_access_token,
        google_refresh_token,
        google_token_expiry,
        google_drive_folder_id,
        -- AI keys
        gemini_api_key,
        grok_api_key,
        claude_api_key,
        -- Video
        kling_access_key,
        kling_secret_key,
        -- Communication
        global_sms_api_key,
        whatsapp_api_key,
        -- Media
        youtube_api_key
    )
SELECT b.id,
    b.google_access_token,
    b.google_refresh_token,
    b.google_token_expiry,
    b.google_drive_folder_id,
    b.gemini_api_key,
    b.grok_api_key,
    b.claude_api_key,
    b.kling_access_key,
    b.kling_secret_key,
    b.global_sms_api_key,
    b.whatsapp_api_key,
    b.youtube_api_key
FROM public.businesses b ON CONFLICT (business_id) DO
UPDATE
SET -- Only overwrite if the source has a non-null value (don't overwrite with NULL)
    google_access_token = COALESCE(
        EXCLUDED.google_access_token,
        business_secrets.google_access_token
    ),
    google_refresh_token = COALESCE(
        EXCLUDED.google_refresh_token,
        business_secrets.google_refresh_token
    ),
    google_token_expiry = COALESCE(
        EXCLUDED.google_token_expiry,
        business_secrets.google_token_expiry
    ),
    google_drive_folder_id = COALESCE(
        EXCLUDED.google_drive_folder_id,
        business_secrets.google_drive_folder_id
    ),
    gemini_api_key = COALESCE(
        EXCLUDED.gemini_api_key,
        business_secrets.gemini_api_key
    ),
    grok_api_key = COALESCE(
        EXCLUDED.grok_api_key,
        business_secrets.grok_api_key
    ),
    claude_api_key = COALESCE(
        EXCLUDED.claude_api_key,
        business_secrets.claude_api_key
    ),
    kling_access_key = COALESCE(
        EXCLUDED.kling_access_key,
        business_secrets.kling_access_key
    ),
    kling_secret_key = COALESCE(
        EXCLUDED.kling_secret_key,
        business_secrets.kling_secret_key
    ),
    global_sms_api_key = COALESCE(
        EXCLUDED.global_sms_api_key,
        business_secrets.global_sms_api_key
    ),
    whatsapp_api_key = COALESCE(
        EXCLUDED.whatsapp_api_key,
        business_secrets.whatsapp_api_key
    ),
    youtube_api_key = COALESCE(
        EXCLUDED.youtube_api_key,
        business_secrets.youtube_api_key
    ),
    updated_at = NOW();
-- Verify migration
SELECT business_id,
    CASE
        WHEN gemini_api_key IS NOT NULL THEN '✅'
        ELSE '❌'
    END AS gemini,
    CASE
        WHEN grok_api_key IS NOT NULL THEN '✅'
        ELSE '❌'
    END AS grok,
    CASE
        WHEN claude_api_key IS NOT NULL THEN '✅'
        ELSE '❌'
    END AS claude,
    CASE
        WHEN youtube_api_key IS NOT NULL THEN '✅'
        ELSE '❌'
    END AS youtube,
    CASE
        WHEN kling_access_key IS NOT NULL THEN '✅'
        ELSE '❌'
    END AS kling,
    CASE
        WHEN global_sms_api_key IS NOT NULL THEN '✅'
        ELSE '❌'
    END AS sms,
    CASE
        WHEN whatsapp_api_key IS NOT NULL THEN '✅'
        ELSE '❌'
    END AS whatsapp,
    CASE
        WHEN google_refresh_token IS NOT NULL THEN '✅'
        ELSE '❌'
    END AS google
FROM public.business_secrets;
-- ═══════════════════════════════════════════════════════════════════════════
-- PART B: Supabase Vault — Transparent Column Encryption (TCE)
-- ═══════════════════════════════════════════════════════════════════════════
-- NOTE: This requires the pgsodium extension and Supabase Vault to be enabled.
--       If running on a self-hosted Supabase stack, ensure pgsodium is installed.
--
-- The approach uses pgsodium's column-level encryption via security labels.
-- Each column is associated with a key from the Vault key store.
-- Data is encrypted at rest but decrypted transparently via a decrypted view.
-- ═══════════════════════════════════════════════════════════════════════════
-- Uncomment and run these if pgsodium is available:
-- (On Supabase Cloud, these work out of the box)
/*
 -- Create a dedicated encryption key in the Vault
 SELECT vault.create_secret('business_secrets_encryption_key', 'Encryption key for business_secrets columns');
 
 -- Enable TCE on each sensitive column
 -- This encrypts data at rest; a decrypted view is automatically created
 SECURITY LABEL FOR pgsodium ON COLUMN public.business_secrets.gemini_api_key IS 'ENCRYPT WITH KEY ID (SELECT id FROM pgsodium.valid_key WHERE name = ''business_secrets_encryption_key'') SECURITY INVOKER';
 SECURITY LABEL FOR pgsodium ON COLUMN public.business_secrets.grok_api_key IS 'ENCRYPT WITH KEY ID (SELECT id FROM pgsodium.valid_key WHERE name = ''business_secrets_encryption_key'') SECURITY INVOKER';
 SECURITY LABEL FOR pgsodium ON COLUMN public.business_secrets.claude_api_key IS 'ENCRYPT WITH KEY ID (SELECT id FROM pgsodium.valid_key WHERE name = ''business_secrets_encryption_key'') SECURITY INVOKER';
 SECURITY LABEL FOR pgsodium ON COLUMN public.business_secrets.kling_access_key IS 'ENCRYPT WITH KEY ID (SELECT id FROM pgsodium.valid_key WHERE name = ''business_secrets_encryption_key'') SECURITY INVOKER';
 SECURITY LABEL FOR pgsodium ON COLUMN public.business_secrets.kling_secret_key IS 'ENCRYPT WITH KEY ID (SELECT id FROM pgsodium.valid_key WHERE name = ''business_secrets_encryption_key'') SECURITY INVOKER';
 SECURITY LABEL FOR pgsodium ON COLUMN public.business_secrets.global_sms_api_key IS 'ENCRYPT WITH KEY ID (SELECT id FROM pgsodium.valid_key WHERE name = ''business_secrets_encryption_key'') SECURITY INVOKER';
 SECURITY LABEL FOR pgsodium ON COLUMN public.business_secrets.whatsapp_api_key IS 'ENCRYPT WITH KEY ID (SELECT id FROM pgsodium.valid_key WHERE name = ''business_secrets_encryption_key'') SECURITY INVOKER';
 SECURITY LABEL FOR pgsodium ON COLUMN public.business_secrets.youtube_api_key IS 'ENCRYPT WITH KEY ID (SELECT id FROM pgsodium.valid_key WHERE name = ''business_secrets_encryption_key'') SECURITY INVOKER';
 SECURITY LABEL FOR pgsodium ON COLUMN public.business_secrets.google_access_token IS 'ENCRYPT WITH KEY ID (SELECT id FROM pgsodium.valid_key WHERE name = ''business_secrets_encryption_key'') SECURITY INVOKER';
 SECURITY LABEL FOR pgsodium ON COLUMN public.business_secrets.google_refresh_token IS 'ENCRYPT WITH KEY ID (SELECT id FROM pgsodium.valid_key WHERE name = ''business_secrets_encryption_key'') SECURITY INVOKER';
 */
-- Alternative for self-hosted without pgsodium:
-- Use pgcrypto for manual encryption/decryption.
-- This is a simpler approach but requires changes to read/write queries.
-- Uncomment if using pgcrypto instead:
/*
 CREATE EXTENSION IF NOT EXISTS pgcrypto;
 
 -- Example: Encrypt a column value
 -- UPDATE business_secrets 
 -- SET gemini_api_key = pgp_sym_encrypt(gemini_api_key, current_setting('app.encryption_key'))
 -- WHERE gemini_api_key IS NOT NULL;
 */