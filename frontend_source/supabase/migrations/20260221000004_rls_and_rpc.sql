-- ============================================================================
-- Migration 004: RLS Policies + SECURITY DEFINER RPC
-- ============================================================================
-- Purpose: Lock down business_secrets with strict Row Level Security
--          and provide a SECURITY DEFINER function for server-side access.
-- ============================================================================
-- ═══════════════════════════════════════════════════════════════════════════
-- PART A: Enable RLS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.business_secrets ENABLE ROW LEVEL SECURITY;
-- Force RLS for table owner too (prevents accidental bypass)
ALTER TABLE public.business_secrets FORCE ROW LEVEL SECURITY;
-- ═══════════════════════════════════════════════════════════════════════════
-- PART B: Drop existing policies (idempotent cleanup)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Service role full access" ON public.business_secrets;
DROP POLICY IF EXISTS "Business owners can read own secrets" ON public.business_secrets;
DROP POLICY IF EXISTS "Business owners can insert own secrets" ON public.business_secrets;
DROP POLICY IF EXISTS "Business owners can update own secrets" ON public.business_secrets;
DROP POLICY IF EXISTS "No anonymous access" ON public.business_secrets;
-- ═══════════════════════════════════════════════════════════════════════════
-- PART C: Create RLS Policies
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Service role bypass (Edge Functions, backend with service_role key)
--    The service_role key bypasses RLS by default in Supabase,
--    but we add an explicit policy for clarity.
CREATE POLICY "Service role full access" ON public.business_secrets FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- 2. Business owners/admins can read their own secrets
--    This checks that the authenticated user belongs to the business
--    via the employees table (where auth_user_id matches).
CREATE POLICY "Business owners can read own secrets" ON public.business_secrets FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.employees e
            WHERE e.business_id = business_secrets.business_id
                AND e.auth_user_id = auth.uid()
                AND e.access_level IN ('Owner', 'Admin', 'Manager')
        )
    );
-- 3. Business owners/admins can insert their own secrets
CREATE POLICY "Business owners can insert own secrets" ON public.business_secrets FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.employees e
            WHERE e.business_id = business_secrets.business_id
                AND e.auth_user_id = auth.uid()
                AND e.access_level IN ('Owner', 'Admin', 'Manager')
        )
    );
-- 4. Business owners/admins can update their own secrets
CREATE POLICY "Business owners can update own secrets" ON public.business_secrets FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.employees e
            WHERE e.business_id = business_secrets.business_id
                AND e.auth_user_id = auth.uid()
                AND e.access_level IN ('Owner', 'Admin', 'Manager')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.employees e
            WHERE e.business_id = business_secrets.business_id
                AND e.auth_user_id = auth.uid()
                AND e.access_level IN ('Owner', 'Admin', 'Manager')
        )
    );
-- ═══════════════════════════════════════════════════════════════════════════
-- PART D: SECURITY DEFINER RPC for Server-Side Access
-- ═══════════════════════════════════════════════════════════════════════════
-- This function allows backend services (Edge Functions, Node.js with
-- service_role key) to fetch secrets without being blocked by RLS.
-- It runs as the function definer (postgres superuser), bypassing RLS.
CREATE OR REPLACE FUNCTION public.get_business_secrets(p_business_id UUID) RETURNS TABLE (
        business_id UUID,
        gemini_api_key TEXT,
        grok_api_key TEXT,
        claude_api_key TEXT,
        youtube_api_key TEXT,
        kling_access_key TEXT,
        kling_secret_key TEXT,
        global_sms_api_key TEXT,
        whatsapp_api_key TEXT,
        google_access_token TEXT,
        google_refresh_token TEXT,
        google_token_expiry TIMESTAMP WITH TIME ZONE,
        google_drive_folder_id TEXT
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN QUERY
SELECT s.business_id,
    s.gemini_api_key,
    s.grok_api_key,
    s.claude_api_key,
    s.youtube_api_key,
    s.kling_access_key,
    s.kling_secret_key,
    s.global_sms_api_key,
    s.whatsapp_api_key,
    s.google_access_token,
    s.google_refresh_token,
    s.google_token_expiry,
    s.google_drive_folder_id
FROM public.business_secrets s
WHERE s.business_id = p_business_id;
END;
$$;
-- Restrict who can call this function
-- Only authenticated users and service_role can invoke it
REVOKE ALL ON FUNCTION public.get_business_secrets(UUID)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_business_secrets(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_secrets(UUID) TO service_role;
-- ═══════════════════════════════════════════════════════════════════════════
-- PART E: Helper RPC for Upserting a Single Secret Field
-- ═══════════════════════════════════════════════════════════════════════════
-- Used by frontend settings pages to save individual API keys.
CREATE OR REPLACE FUNCTION public.upsert_business_secret(
        p_business_id UUID,
        p_field TEXT,
        p_value TEXT
    ) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN -- Validate field name to prevent SQL injection
    IF p_field NOT IN (
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
        'google_drive_folder_id'
    ) THEN RAISE EXCEPTION 'Invalid field name: %',
    p_field;
END IF;
-- Ensure the row exists
INSERT INTO public.business_secrets (business_id)
VALUES (p_business_id) ON CONFLICT (business_id) DO NOTHING;
-- Dynamic update
EXECUTE format(
    'UPDATE public.business_secrets SET %I = $1, updated_at = NOW() WHERE business_id = $2',
    p_field
) USING p_value,
p_business_id;
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_business_secret(UUID, TEXT, TEXT)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_business_secret(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_business_secret(UUID, TEXT, TEXT) TO service_role;
-- ═══════════════════════════════════════════════════════════════════════════
-- PART F: Grant table-level permissions
-- ═══════════════════════════════════════════════════════════════════════════
-- Revoke all from anon
REVOKE ALL ON public.business_secrets
FROM anon;
-- Authenticated users get governed by RLS policies above
GRANT SELECT,
    INSERT,
    UPDATE ON public.business_secrets TO authenticated;
GRANT ALL ON public.business_secrets TO service_role;
-- ═══════════════════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════════════════
SELECT schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'business_secrets';