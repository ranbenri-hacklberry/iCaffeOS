-- Fix music_songs unique constraint
-- The base schema only has a COMPOSITE unique on (file_path, business_id),
-- but music_songs does not use business_id in practice.
-- Add a simple single-column unique index on file_path so that
-- onConflict: 'file_path' works in upsert operations.
-- This migration is safe to run even if constraint already exists (uses IF NOT EXISTS).

DO $$
BEGIN
    -- Drop the old composite constraint if it exists (may conflict with single-col)
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'music_songs_file_path_business_id_key'
          AND conrelid = 'public.music_songs'::regclass
    ) THEN
        ALTER TABLE public.music_songs
            DROP CONSTRAINT music_songs_file_path_business_id_key;
        RAISE NOTICE 'Dropped composite constraint music_songs_file_path_business_id_key';
    END IF;

    -- Add single-column unique constraint if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'music_songs_file_path_key'
          AND conrelid = 'public.music_songs'::regclass
    ) THEN
        ALTER TABLE public.music_songs
            ADD CONSTRAINT music_songs_file_path_key UNIQUE (file_path);
        RAISE NOTICE 'Added single-column constraint music_songs_file_path_key';
    END IF;
END $$;
