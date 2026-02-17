-- Migration: Quality Tiering and Distributed Nodes for rantunes
-- Created: 2026-02-16
-- 1. Enhance music_songs with quality metadata
ALTER TABLE public.music_songs
ADD COLUMN IF NOT EXISTS audio_quality TEXT DEFAULT 'SD';
-- 'Hi-Fi', 'HD', 'SD'
ALTER TABLE public.music_songs
ADD COLUMN IF NOT EXISTS bitrate INTEGER;
-- in kbps
ALTER TABLE public.music_songs
ADD COLUMN IF NOT EXISTS sample_rate INTEGER;
-- in Hz
ALTER TABLE public.music_songs
ADD COLUMN IF NOT EXISTS format TEXT;
-- 'flac', 'aac', 'mp3'
-- 2. Nodes table for cross-device discovery
CREATE TABLE IF NOT EXISTS public.music_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hostname TEXT NOT NULL,
    local_ip TEXT NOT NULL,
    device_type TEXT,
    -- 'n150', 'mbp', 'ipad', 'mobile'
    is_online BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    capabilities JSONB DEFAULT '{}'::jsonb,
    -- e.g. {"can_transcode": true, "has_archive": true}
    business_id UUID -- optional, if multi-tenant
);
CREATE INDEX IF NOT EXISTS idx_music_nodes_is_online ON public.music_nodes(is_online);
-- 3. Source preference function (SQL helper)
CREATE OR REPLACE FUNCTION get_best_source(input_song_id UUID) RETURNS SETOF public.music_songs AS $$ BEGIN RETURN QUERY
SELECT *
FROM public.music_songs
WHERE id = input_song_id
ORDER BY CASE
        WHEN audio_quality = 'Hi-Fi' THEN 1
        WHEN audio_quality = 'HD' THEN 2
        ELSE 3
    END ASC
LIMIT 1;
END;
$$ LANGUAGE plpgsql;