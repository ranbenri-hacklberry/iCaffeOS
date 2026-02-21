-- ============================================================================
-- Migration 002: Expand business_secrets Table
-- ============================================================================
-- Purpose: Add all API key/token columns to business_secrets.
--          The table already has Google OAuth columns from a prior migration.
--          This adds: AI keys, SMS, WhatsApp, YouTube, and Kling credentials.
-- ============================================================================
-- 1. Ensure the table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.business_secrets (
    business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
    -- Google OAuth (already present from prior migration)
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expiry TIMESTAMP WITH TIME ZONE,
    google_drive_folder_id TEXT,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Add new columns (IF NOT EXISTS makes this idempotent)
DO $$ BEGIN -- AI Provider Keys
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'business_secrets'
        AND column_name = 'gemini_api_key'
) THEN
ALTER TABLE public.business_secrets
ADD COLUMN gemini_api_key TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'business_secrets'
        AND column_name = 'grok_api_key'
) THEN
ALTER TABLE public.business_secrets
ADD COLUMN grok_api_key TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'business_secrets'
        AND column_name = 'claude_api_key'
) THEN
ALTER TABLE public.business_secrets
ADD COLUMN claude_api_key TEXT;
END IF;
-- Video Generation
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'business_secrets'
        AND column_name = 'kling_access_key'
) THEN
ALTER TABLE public.business_secrets
ADD COLUMN kling_access_key TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'business_secrets'
        AND column_name = 'kling_secret_key'
) THEN
ALTER TABLE public.business_secrets
ADD COLUMN kling_secret_key TEXT;
END IF;
-- Communication
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'business_secrets'
        AND column_name = 'global_sms_api_key'
) THEN
ALTER TABLE public.business_secrets
ADD COLUMN global_sms_api_key TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'business_secrets'
        AND column_name = 'whatsapp_api_key'
) THEN
ALTER TABLE public.business_secrets
ADD COLUMN whatsapp_api_key TEXT;
END IF;
-- Media
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'business_secrets'
        AND column_name = 'youtube_api_key'
) THEN
ALTER TABLE public.business_secrets
ADD COLUMN youtube_api_key TEXT;
END IF;
END $$;
-- 3. Add updated_at trigger (auto-update on modification)
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Drop and recreate to avoid duplicate trigger errors
DROP TRIGGER IF EXISTS set_business_secrets_updated_at ON public.business_secrets;
CREATE TRIGGER set_business_secrets_updated_at BEFORE
UPDATE ON public.business_secrets FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
-- 4. Add helpful comment
COMMENT ON TABLE public.business_secrets IS 'Secure storage for business API keys and tokens. Access via RLS or SECURITY DEFINER RPCs only.';
-- Verify
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'business_secrets'
ORDER BY ordinal_position;