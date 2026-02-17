-- Migration: CD Import and Legal Compliance for rantunes
-- Created: 2026-02-16
ALTER TABLE public.music_songs
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'digital';
ALTER TABLE public.music_songs
ADD COLUMN IF NOT EXISTS disc_id TEXT;
ALTER TABLE public.music_songs
ADD COLUMN IF NOT EXISTS album_token TEXT;
ALTER TABLE public.music_songs
ADD COLUMN IF NOT EXISTS provenance_image_url TEXT;
-- For UI/UX tracking
ALTER TABLE public.music_songs
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
-- Compliance Log Table
CREATE TABLE IF NOT EXISTS public.compliance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    activity_type TEXT NOT NULL,
    -- 'cd_import', 'deletion_declaration'
    target_id UUID,
    -- song_id or album_id
    legal_declaration_accepted BOOLEAN DEFAULT FALSE,
    provenance_image_url TEXT,
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Grant permissions
GRANT ALL ON public.compliance_logs TO authenticated;
GRANT ALL ON public.compliance_logs TO service_role;
-- Index for album tokens (ownership verification)
CREATE INDEX IF NOT EXISTS idx_music_songs_album_token ON public.music_songs(album_token);
CREATE INDEX IF NOT EXISTS idx_music_songs_source_type ON public.music_songs(source_type);