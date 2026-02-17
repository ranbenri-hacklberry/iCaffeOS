import { LocalAssetScanner } from '../localAssetScanner.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';

dotenv.config();

const localUrl = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const localKey = process.env.LOCAL_SUPABASE_SERVICE_KEY;

if (!localKey) {
    console.error('❌ LOCAL_SUPABASE_SERVICE_KEY is missing from .env');
    process.exit(1);
}

const supabase = createClient(localUrl, localKey);

async function sync() {
    console.log('🔄 Starting Library Sync (LOCAL)...');

    // Locations to scan
    const isMac = process.platform === 'darwin';
    const scanPaths = [
        path.join(os.homedir(), 'Music', 'iCaffe'),
        isMac ? '/Volumes/RANTUNES' : '/mnt/music_ssd'
    ];

    let allTracks = [];
    for (const scanPath of scanPaths) {
        if (!fs.existsSync(scanPath)) continue;
        console.log(`📂 Scanning: ${scanPath}`);
        const scanner = new LocalAssetScanner(scanPath);
        const tracks = await scanner.scan();
        allTracks = allTracks.concat(tracks);
    }

    console.log(`🔎 Found ${allTracks.length} total tracks. Registering...`);

    for (const track of allTracks) {
        try {
            // Find or create artist
            let { data: artistData } = await supabase.from('music_artists').select('id').eq('name', track.artist).maybeSingle();
            if (!artistData) {
                const { data: newArtist } = await supabase.from('music_artists').insert({ name: track.artist }).select('id').single();
                artistData = newArtist;
            }

            // Find or create album
            let { data: albumData } = await supabase.from('music_albums').select('id').eq('name', track.album).eq('artist_id', artistData.id).maybeSingle();
            if (!albumData) {
                const { data: newAlbum } = await supabase.from('music_albums').insert({
                    name: track.album,
                    artist_id: artistData.id
                }).select('id').single();
                albumData = newAlbum;
            }

            // Check if song exists by file_path
            const { data: existingSong } = await supabase.from('music_songs').select('id').eq('file_path', track.file_path).maybeSingle();

            if (existingSong) {
                console.log(`⏩ Already registered: ${track.title}`);
                continue;
            }

            // Register song
            const { error } = await supabase.from('music_songs').insert({
                title: track.title,
                artist_id: artistData.id,
                album_id: albumData.id,
                file_path: track.file_path,
                file_name: path.basename(track.file_path),
                duration_seconds: Math.round(track.duration),
                business_id: '22222222-2222-2222-2222-222222222222'
            });

            if (error) console.error(`❌ Failed to register ${track.title}:`, error.message);
            else console.log(`✅ Registered: ${track.title}`);

        } catch (err) {
            console.error(`❌ Error processing ${track.title}:`, err.message);
        }
    }

    console.log('🎉 Sync complete!');
}

sync();
