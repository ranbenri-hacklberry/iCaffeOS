-- Migration: Add Playback History Logic for rantunes
-- Created: 2026-02-14
-- 1. Create playback history table if it doesn't exist (it might, but let's be safe)
CREATE TABLE IF NOT EXISTS public.music_playback_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    song_id UUID REFERENCES public.music_songs(id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ DEFAULT NOW(),
    device_id TEXT,
    employee_id UUID REFERENCES public.employees(id) ON DELETE
    SET NULL,
        business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
        was_skipped BOOLEAN DEFAULT FALSE
);
-- Index for fast lookup of recent plays
CREATE INDEX IF NOT EXISTS idx_music_history_song_played ON public.music_playback_history(song_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_history_business_played ON public.music_playback_history(business_id, played_at DESC);
-- 2. Add last_played_at to music_songs if missing
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'music_songs'
        AND column_name = 'last_played_at'
) THEN
ALTER TABLE public.music_songs
ADD COLUMN last_played_at TIMESTAMPTZ;
END IF;
END $$;
-- 3. Create the log_song_playback function
CREATE OR REPLACE FUNCTION log_song_playback(
        p_song_id UUID,
        p_device_id TEXT DEFAULT NULL,
        p_employee_id UUID DEFAULT NULL,
        p_business_id UUID DEFAULT NULL
    ) RETURNS VOID AS $$ BEGIN -- 1. Insert into history to track the cooldown
INSERT INTO public.music_playback_history (
        song_id,
        played_at,
        device_id,
        employee_id,
        business_id
    )
VALUES (
        p_song_id,
        NOW(),
        p_device_id,
        p_employee_id,
        p_business_id
    );
-- 2. Update last_played_at for quick lookup
UPDATE public.music_songs
SET last_played_at = NOW()
WHERE id = p_song_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. Grant permissions
GRANT ALL ON public.music_playback_history TO authenticated;
GRANT ALL ON public.music_playback_history TO service_role;
GRANT EXECUTE ON FUNCTION log_song_playback TO authenticated;
GRANT EXECUTE ON FUNCTION log_song_playback TO service_role;