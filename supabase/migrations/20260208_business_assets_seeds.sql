-- Migration: Add business assets (logos) and seeds (backgrounds) tables
-- These tables support the PostCreator component for marketing visuals
-- Run this in Supabase SQL Editor

-- ===========================================
-- 1. ADD GROK API KEY COLUMN TO BUSINESSES
-- ===========================================
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS grok_api_key TEXT;

COMMENT ON COLUMN businesses.grok_api_key IS 'xAI Grok API key for image generation (Aurora model)';

-- ===========================================
-- 2. CREATE BUSINESS_ASSETS TABLE (LOGOS)
-- ===========================================
CREATE TABLE IF NOT EXISTS business_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL DEFAULT 'logo',
    name VARCHAR(255),
    url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_assets_business_type
ON business_assets(business_id, asset_type);

-- ===========================================
-- 3. CREATE BUSINESS_SEEDS TABLE (BACKGROUNDS)
-- ===========================================
CREATE TABLE IF NOT EXISTS business_seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL DEFAULT 'background',
    name VARCHAR(255),
    image_url TEXT,
    prompt_hint TEXT,
    style VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_seeds_business_category
ON business_seeds(business_id, category);

-- ===========================================
-- 4. UPDATE_AT TRIGGER FUNCTION
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_business_assets_updated_at ON business_assets;
CREATE TRIGGER update_business_assets_updated_at
    BEFORE UPDATE ON business_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_seeds_updated_at ON business_seeds;
CREATE TRIGGER update_business_seeds_updated_at
    BEFORE UPDATE ON business_seeds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 5. ROW LEVEL SECURITY - PERMISSIVE POLICIES
-- ===========================================
-- Enable RLS
ALTER TABLE business_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_seeds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their business assets" ON business_assets;
DROP POLICY IF EXISTS "Users can manage their business seeds" ON business_seeds;
DROP POLICY IF EXISTS "business_assets_select" ON business_assets;
DROP POLICY IF EXISTS "business_assets_insert" ON business_assets;
DROP POLICY IF EXISTS "business_assets_update" ON business_assets;
DROP POLICY IF EXISTS "business_assets_delete" ON business_assets;
DROP POLICY IF EXISTS "business_seeds_select" ON business_seeds;
DROP POLICY IF EXISTS "business_seeds_insert" ON business_seeds;
DROP POLICY IF EXISTS "business_seeds_update" ON business_seeds;
DROP POLICY IF EXISTS "business_seeds_delete" ON business_seeds;

-- BUSINESS_ASSETS: Permissive policies (user must belong to business)
CREATE POLICY "business_assets_select" ON business_assets
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM employees WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

CREATE POLICY "business_assets_insert" ON business_assets
    FOR INSERT WITH CHECK (
        business_id IN (SELECT business_id FROM employees WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

CREATE POLICY "business_assets_update" ON business_assets
    FOR UPDATE USING (
        business_id IN (SELECT business_id FROM employees WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

CREATE POLICY "business_assets_delete" ON business_assets
    FOR DELETE USING (
        business_id IN (SELECT business_id FROM employees WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

-- BUSINESS_SEEDS: Permissive policies (user must belong to business)
CREATE POLICY "business_seeds_select" ON business_seeds
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM employees WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

CREATE POLICY "business_seeds_insert" ON business_seeds
    FOR INSERT WITH CHECK (
        business_id IN (SELECT business_id FROM employees WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

CREATE POLICY "business_seeds_update" ON business_seeds
    FOR UPDATE USING (
        business_id IN (SELECT business_id FROM employees WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

CREATE POLICY "business_seeds_delete" ON business_seeds
    FOR DELETE USING (
        business_id IN (SELECT business_id FROM employees WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

-- ===========================================
-- 6. STORAGE BUCKET FOR BUSINESS ASSETS
-- ===========================================
-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'business-assets',
    'business-assets',
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880;

-- Storage policies for business-assets bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- Allow any authenticated user to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-assets');

-- Allow public read access
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'business-assets');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow users to delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'business-assets');

-- ===========================================
-- 7. DOCUMENTATION
-- ===========================================
COMMENT ON TABLE business_assets IS 'Stores business visual assets like logos, icons, watermarks for marketing';
COMMENT ON TABLE business_seeds IS 'Stores seed images/styles for AI image generation (backgrounds, containers)';
