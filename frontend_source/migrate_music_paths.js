
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('🔄 Updating music library paths in Supabase...');

    // Using individual updates since REPLACE is a SQL function and we might need to use RPC or direct updates if we have thousands of records
    // But for a quick fix, let's fetch and update

    // 1. Songs
    console.log('🎵 Fetching songs with old paths...');
    const { data: songs, error: sErr } = await supabase
        .from('music_songs')
        .select('id, file_path')
        .like('file_path', '/Volumes/Ran1%');

    if (sErr) console.error('Error fetching songs:', sErr);
    else if (songs) {
        console.log(`Found ${songs.length} songs to update.`);
        for (const song of songs) {
            const newPath = song.file_path.replace('/Volumes/Ran1/Music', '/Volumes/RANTUNES').replace('/Volumes/Ran1', '/Volumes/RANTUNES');
            await supabase.from('music_songs').update({ file_path: newPath }).eq('id', song.id);
        }
        console.log('✅ Songs updated.');
    }

    // 2. Albums
    console.log('📀 Fetching albums with old paths...');
    const { data: albums, error: aErr } = await supabase
        .from('music_albums')
        .select('id, folder_path, cover_url')
        .or('folder_path.like./Volumes/Ran1%,cover_url.like./Volumes/Ran1%');

    if (aErr) console.error('Error fetching albums:', aErr);
    else if (albums) {
        console.log(`Found ${albums.length} albums to update.`);
        for (const album of albums) {
            const updates = {};
            if (album.folder_path && album.folder_path.includes('/Volumes/Ran1')) {
                updates.folder_path = album.folder_path.replace('/Volumes/Ran1/Music', '/Volumes/RANTUNES').replace('/Volumes/Ran1', '/Volumes/RANTUNES');
            }
            if (album.cover_url && album.cover_url.includes('/Volumes/Ran1')) {
                updates.cover_url = album.cover_url.replace('/Volumes/Ran1/Music', '/Volumes/RANTUNES').replace('/Volumes/Ran1', '/Volumes/RANTUNES');
            }
            if (Object.keys(updates).length > 0) {
                await supabase.from('music_albums').update(updates).eq('id', album.id);
            }
        }
        console.log('✅ Albums updated.');
    }

    console.log('🏁 Migration complete!');
}

run();
