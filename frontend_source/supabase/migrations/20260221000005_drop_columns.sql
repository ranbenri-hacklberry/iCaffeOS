-- ============================================================================
-- Migration 005: Drop Sensitive Columns from businesses Table
-- ============================================================================
-- ⚠️ WARNING: Run this ONLY AFTER all code consumers have been updated 
--    to use business_secrets exclusively and tested in production.
-- ============================================================================
-- This is the final step. Once executed, there is no going back without
-- restoring from backup.
-- ============================================================================
-- Safety check: Verify data was migrated
DO $$
DECLARE unmigrated_count INTEGER;
BEGIN -- Count businesses that have keys NOT yet in business_secrets
SELECT COUNT(*) INTO unmigrated_count
FROM public.businesses b
WHERE (
        b.gemini_api_key IS NOT NULL
        OR b.grok_api_key IS NOT NULL
    )
    AND NOT EXISTS (
        SELECT 1
        FROM public.business_secrets s
        WHERE s.business_id = b.id
    );
IF unmigrated_count > 0 THEN RAISE EXCEPTION 'ABORT: % businesses have keys not yet migrated to business_secrets!',
unmigrated_count;
END IF;
RAISE NOTICE '✅ Safety check passed: All businesses with keys have been migrated.';
END $$;
-- Drop the secret columns from businesses table
-- Using IF EXISTS for idempotent execution
ALTER TABLE public.businesses DROP COLUMN IF EXISTS gemini_api_key;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS grok_api_key;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS claude_api_key;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS youtube_api_key;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS kling_access_key;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS kling_secret_key;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS global_sms_api_key;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS whatsapp_api_key;
-- Google OAuth tokens (already migrated in prior step)
ALTER TABLE public.businesses DROP COLUMN IF EXISTS google_access_token;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS google_refresh_token;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS google_token_expiry;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS google_drive_folder_id;
-- Verify: These columns should no longer appear
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'businesses'
    AND column_name IN (
        'gemini_api_key',
        'grok_api_key',
        'claude_api_key',
        'youtube_api_key',
        'kling_access_key',
        'kling_secret_key',
        'global_sms_api_key',
        'whatsapp_api_key',
        'google_access_token',
        'google_refresh_token',
        'google_token_expiry',
        'google_drive_folder_id'
    );
-- Expected: 0 rows