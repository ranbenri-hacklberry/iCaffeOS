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
-- Turn on RLS
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;
-- Allow authenticated/anon access to business_config (Cortex gateway uses service role so it bypasses anyway but good practice)
CREATE POLICY "Allow public read access to business_config" ON public.business_config FOR ALL USING (true) WITH CHECK (true);