const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function cleanup() {
    console.log('🎵 Starting Music Title Cleanup...');

    // 1. Fetch songs with " - " in title
    const { data: songs, error } = await supabase
        .from('music_songs')
        .select(`
            id, 
            title, 
            artist_id,
            artist:artist_id(name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching songs:', error);
        return;
    }

    console.log(`🔍 Found ${songs.length} total songs.`);

    let fixedCount = 0;

    for (const song of songs) {
        // Only fix if the title contains " - " AND (optionally) the artist name is "Unknown Artist" or similar
        // Or just if it has " - " we assume it's messy.
        if (song.title.includes(' - ')) {
            const parts = song.title.split(' - ');
            if (parts.length >= 2) {
                const artistName = parts[0].trim();
                const songTitle = parts.slice(1).join(' - ').trim();

                // Skip if it seems like a false positive (e.g. title is too short or something)
                if (!artistName || !songTitle) continue;

                console.log(`✨ Fixing: "${song.title}" -> Artist: "${artistName}", Title: "${songTitle}"`);

                try {
                    // Find or create artist
                    let artistId = null;
                    const { data: existingArtist } = await supabase
                        .from('music_artists')
                        .select('id')
                        .eq('name', artistName)
                        .maybeSingle();

                    if (existingArtist) {
                        artistId = existingArtist.id;
                    } else {
                        const { data: newArtist, error: createError } = await supabase
                            .from('music_artists')
                            .insert({ name: artistName })
                            .select('id')
                            .single();

                        // If it failed because of Unique Constraint, try fetching again
                        if (createError) {
                            const { data: secondTry } = await supabase
                                .from('music_artists')
                                .select('id')
                                .eq('name', artistName)
                                .maybeSingle();
                            artistId = secondTry?.id;
                        } else {
                            artistId = newArtist.id;
                        }
                    }

                    if (artistId) {
                        // Update song
                        const { error: updateError } = await supabase
                            .from('music_songs')
                            .update({
                                title: songTitle,
                                artist_id: artistId
                            })
                            .eq('id', song.id);

                        if (updateError) {
                            console.error(`Error updating song ${song.id}:`, updateError);
                        } else {
                            fixedCount++;
                        }
                    }
                } catch (e) {
                    console.error('Unexpected error processing song:', e);
                }
            }
        }
    }

    console.log(`✅ Finished! Fixed ${fixedCount} songs.`);
}

cleanup();
