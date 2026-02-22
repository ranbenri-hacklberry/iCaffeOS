-- Comprehensive Cortex V2 & iCaffeOS Fixes
-- 1. Business Config (if missing)
CREATE TABLE IF NOT EXISTS public.business_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    core_entities TEXT [] DEFAULT '{}',
    tone_of_voice TEXT NOT NULL DEFAULT 'professional',
    custom_instructions TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to business_config" ON public.business_config;
CREATE POLICY "Allow public access to business_config" ON public.business_config FOR ALL USING (true) WITH CHECK (true);
-- 2. Cases (for LAW_FIRM)
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    case_number TEXT NOT NULL,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    description TEXT,
    court_date TIMESTAMPTZ,
    assigned_attorney TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to cases" ON public.cases;
CREATE POLICY "Allow public access to cases" ON public.cases FOR ALL USING (true) WITH CHECK (true);
-- 3. Devices (for IT_LAB)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    cpu TEXT,
    ram_gb INT,
    storage_gb INT,
    os TEXT,
    os_version TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to devices" ON public.devices;
CREATE POLICY "Allow public access to devices" ON public.devices FOR ALL USING (true) WITH CHECK (true);
-- 4. Document Extractions (from documents.py routes/logic)
CREATE TABLE IF NOT EXISTS public.document_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    record_id UUID NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    char_count INTEGER,
    page_count INTEGER,
    extraction_method TEXT,
    sanitized_text TEXT,
    pii_detected BOOLEAN DEFAULT FALSE,
    masked_entities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to document_extractions" ON public.document_extractions;
CREATE POLICY "Allow public access to document_extractions" ON public.document_extractions FOR ALL USING (true) WITH CHECK (true);
-- 5. Fix business_secrets (missing youtube_api_key)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'business_secrets'
        AND column_name = 'youtube_api_key'
) THEN
ALTER TABLE public.business_secrets
ADD COLUMN youtube_api_key TEXT;
END IF;
END $$;
-- 6. Add some sample data for CAFE if menu_items is empty
-- (Usually we'd check count, but adding one is safe for a test)
-- We need a business_id. We'll use the Pilot Cafe ID.
INSERT INTO public.menu_items (
        name,
        price,
        category,
        business_id,
        is_prep_required,
        kds_routing_logic
    )
SELECT 'Espresso',
    10,
    'Coffee',
    '11111111-1111-1111-1111-111111111111',
    false,
    'GRAB_AND_GO'
WHERE EXISTS (
        SELECT 1
        FROM businesses
        WHERE id = '11111111-1111-1111-1111-111111111111'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM menu_items
        WHERE name = 'Espresso'
    ) ON CONFLICT DO NOTHING;