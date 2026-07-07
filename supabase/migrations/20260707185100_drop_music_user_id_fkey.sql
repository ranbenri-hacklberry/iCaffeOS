-- Migration: Drop foreign key constraints to auth.users in music tables
-- Since we authenticate using custom employee PINs and local employees table,
-- auth.users is not populated, and referencing it blocks inserts/updates.

ALTER TABLE public.music_playlists DROP CONSTRAINT IF EXISTS music_playlists_user_id_fkey;
ALTER TABLE public.music_songs DROP CONSTRAINT IF EXISTS music_songs_user_id_fkey;
ALTER TABLE public.music_playlist_songs DROP CONSTRAINT IF EXISTS music_playlist_songs_user_id_fkey;
