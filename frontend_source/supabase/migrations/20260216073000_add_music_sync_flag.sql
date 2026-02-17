-- Migration: Add is_synced to music_songs for rantunes staging-sync logic
-- Created: 2026-02-16
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'music_songs'
        AND column_name = 'is_synced'
) THEN
ALTER TABLE public.music_songs
ADD COLUMN is_synced BOOLEAN DEFAULT TRUE;
-- Default existing tracks to TRUE assuming they are already on the external drive
UPDATE public.music_songs
SET is_synced = TRUE
WHERE is_synced IS NULL;
END IF;
END $$;