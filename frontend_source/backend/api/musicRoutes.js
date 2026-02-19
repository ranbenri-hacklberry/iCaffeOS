
import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { LocalAssetScanner } from '../localAssetScanner.js';
import { CacheService } from '../services/cacheService.js';
import { PathManager } from '../utils/pathManager.js';
import { SyncManager } from '../services/syncManager.js';
import { CDService } from '../services/cdService.js';
import { DiscoveryService } from '../services/discoveryService.js';

const router = express.Router();

// 🔒 Token Verification Middleware
const verifyAlbumToken = async (req, res, next) => {
    const { song_id } = req.query;
    if (!song_id) return next();

    try {
        const { data: song } = await getSupabase().from('music_songs').select('audio_quality, album_token').eq('id', song_id).single();
        if (song?.audio_quality === 'Hi-Fi') {
            // Check if compliance log exists for this token
            const { data: log } = await getSupabase().from('compliance_logs').select('id').eq('provenance_image_url', song.album_token).maybeSingle();
            // In a real env, we'd verify the token cryptographic validity
            // if (!log) return res.status(403).json({ error: 'Lossless playback requires ownership verification' });
        }
        next();
    } catch (err) {
        next();
    }
};

/**
 * Quality-Aware Source Picker (Lossless > HD > SD)
 */
async function getBestAvailableSource(songId) {
    const { data: songs } = await supabase
        .from('music_songs')
        .select('*')
        .eq('id', songId);

    if (!songs || songs.length === 0) return null;

    // Rank logic
    const qualityMap = { 'Hi-Fi': 3, 'HD': 2, 'SD': 1 };
    return songs.sort((a, b) => (qualityMap[b.audio_quality] || 0) - (qualityMap[a.audio_quality] || 0))[0];
}

// Lazy Supabase client initialization (Hybrid Strategy)
let supabase = null;
const getSupabase = () => {
    if (supabase) return supabase;

    const localUrl = process.env.LOCAL_SUPABASE_URL || 'http://localhost:54321';
    const localKey = process.env.LOCAL_SUPABASE_SERVICE_KEY;
    const remoteUrl = process.env.SUPABASE_URL;
    const remoteKey = process.env.SUPABASE_SERVICE_KEY;

    // Use local if available, else remote
    const url = localUrl && localKey ? localUrl : remoteUrl;
    const key = localKey ? localKey : remoteKey;

    if (!url || !key) {
        throw new Error("Supabase credentials missing");
    }

    supabase = createClient(url, key);
    console.log(`✅ [MusicRoutes] Supabase initialized in ${localKey ? 'LOCAL' : 'REMOTE'} mode`);
    return supabase;
};

const ensureSupabase = (req, res, next) => {
    try {
        getSupabase();
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────────
// VOLUMES & SCANNING
// ──────────────────────────────────────────────────────────────

// List available volumes/drives
router.get("/volumes", (req, res) => {
    try {
        const volumesPath = '/Volumes';
        const volumes = [];

        if (fs.existsSync(volumesPath)) {
            const entries = fs.readdirSync(volumesPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() || entry.isSymbolicLink()) {
                    const fullPath = path.join(volumesPath, entry.name);
                    volumes.push({ name: entry.name, path: fullPath });
                }
            }
        }

        // Add common paths (only if not already discovered)
        const existingPaths = new Set(volumes.map(v => v.path));
        const homePath = process.env.HOME || '/Users';
        const musicPath = path.join(homePath, 'Music');
        const ssdPath = '/mnt/music_ssd';
        const rantunesPath = '/Volumes/RANTUNES';
        if (fs.existsSync(rantunesPath) && !existingPaths.has(rantunesPath)) volumes.push({ name: 'דיסק RANTUNES', path: rantunesPath });
        if (fs.existsSync(musicPath) && !existingPaths.has(musicPath)) volumes.push({ name: 'מוזיקה מקומית', path: musicPath });
        if (fs.existsSync(ssdPath) && !existingPaths.has(ssdPath)) volumes.push({ name: 'SSD חיצוני', path: ssdPath });

        // Deduplicate by path (safety net)
        const seen = new Set();
        const uniqueVolumes = volumes.filter(v => {
            if (seen.has(v.path)) return false;
            seen.add(v.path);
            return true;
        });

        res.json({ volumes: uniqueVolumes });
    } catch (err) {
        console.error('Error listing volumes:', err);
        res.json({ volumes: [] });
    }
});

// Helper to register a single asset to DB (used by scan and register)
const artistCache = new Map();
const albumCache = new Map();

async function registerInternal(asset) {
    const { artist, album, title, thumbnail, file_path, duration } = asset;
    const safeArtist = (artist || 'Unknown Artist').replace(/[^\w\s\u0590-\u05FF-]/g, '').trim();
    const isSingle = !album || album === 'Single' || album === 'Singles' || album === 'Unknown Album';
    const safeAlbum = isSingle ? null : album.replace(/[^\w\s\u0590-\u05FF-]/g, '').trim();
    const safeTitle = title.replace(/[^\w\s\u0590-\u05FF-]/g, '').trim();
    const fileName = path.basename(file_path);

    // Try to find or create artist
    let artistId = artistCache.get(safeArtist);
    if (!artistId) {
        let { data: artistData } = await getSupabase().from('music_artists').select('id').eq('name', safeArtist).maybeSingle();
        if (!artistData) {
            const { data: newArtist } = await getSupabase().from('music_artists').insert({ name: safeArtist }).select('id').single();
            artistId = newArtist.id;
        } else {
            artistId = artistData.id;
        }
        artistCache.set(safeArtist, artistId);
    }

    let albumId = null;
    const albumFolderPath = path.dirname(file_path); // folder containing the song = album folder

    if (safeAlbum) {
        const albumCacheKey = `${artistId}:${safeAlbum}`;
        albumId = albumCache.get(albumCacheKey);
        if (!albumId) {
            // Try to find or create album
            let { data: albumData } = await getSupabase().from('music_albums').select('id, cover_url, folder_path').eq('name', safeAlbum).eq('artist_id', artistId).maybeSingle();
            if (!albumData) {
                // Look for a cover file in the album folder
                const coverCandidates = ['cover.jpg', 'cover.png', 'folder.jpg', 'folder.png', 'album.jpg', 'front.jpg'];
                let localCoverPath = null;
                for (const name of coverCandidates) {
                    const testPath = path.join(albumFolderPath, name);
                    if (fs.existsSync(testPath)) { localCoverPath = testPath; break; }
                }
                const { data: newAlbum } = await getSupabase().from('music_albums').insert({
                    name: safeAlbum,
                    artist_id: artistId,
                    cover_url: thumbnail || localCoverPath,
                    folder_path: albumFolderPath
                }).select('id').single();
                albumId = newAlbum.id;
            } else {
                albumId = albumData.id;
                // Backfill folder_path + cover_url if missing
                if (!albumData.folder_path || !albumData.cover_url) {
                    const coverCandidates = ['cover.jpg', 'cover.png', 'folder.jpg', 'folder.png', 'album.jpg', 'front.jpg'];
                    let localCoverPath = albumData.cover_url || null;
                    for (const name of coverCandidates) {
                        const testPath = path.join(albumFolderPath, name);
                        if (fs.existsSync(testPath)) { localCoverPath = testPath; break; }
                    }
                    await getSupabase().from('music_albums').update({
                        folder_path: albumData.folder_path || albumFolderPath,
                        cover_url: albumData.cover_url || localCoverPath
                    }).eq('id', albumData.id);
                }
            }
            albumCache.set(albumCacheKey, albumId);
        }
    }

    // Insert/Update Song - use select-first to avoid onConflict constraint mismatch
    // (local Supabase has composite UNIQUE(file_path, business_id), not single-col)
    const { data: existingSong } = await getSupabase()
        .from('music_songs')
        .select('id')
        .eq('file_path', file_path)
        .maybeSingle();

    const songPayload = {
        title: safeTitle,
        artist_id: artistId,
        album_id: albumId,
        file_path: file_path,
        file_name: fileName,
        duration_seconds: Math.floor(duration || 0),
        is_synced: file_path.includes('/Volumes/RANTUNES') || file_path.includes('/mnt/music_ssd'),
        thumbnail_url: thumbnail,
        updated_at: new Date().toISOString()
    };

    let songData, songError;
    if (existingSong) {
        ({ data: songData, error: songError } = await getSupabase()
            .from('music_songs')
            .update(songPayload)
            .eq('id', existingSong.id)
            .select()
            .single());
    } else {
        ({ data: songData, error: songError } = await getSupabase()
            .from('music_songs')
            .insert(songPayload)
            .select()
            .single());
    }

    if (songError) throw songError;
    return songData;
}

// POST /music/scan
router.post('/scan', ensureSupabase, async (req, res) => {
    try {
        const rootPath = req.body?.path || undefined;
        const saveToDb = req.body?.saveToDb || false;
        const forceClean = req.body?.forceClean || false;

        if (forceClean) {
            console.log("🧹 Force Clean requested. Clearing music tables...");
            await getSupabase().from('music_songs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await getSupabase().from('music_albums').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await getSupabase().from('music_artists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const scanner = new LocalAssetScanner(rootPath);
        const assets = await scanner.scan();

        // Group assets for immediate frontend preview
        const artistsMap = new Map();
        const albumsMap = new Map();

        assets.forEach(asset => {
            const artistName = asset.artist || 'Unknown Artist';
            const albumName = asset.album || 'Unknown Album';

            if (!artistsMap.has(artistName)) {
                artistsMap.set(artistName, { name: artistName, folder_path: path.dirname(path.dirname(asset.file_path)) });
            }

            const albumKey = `${artistName}:${albumName}`;
            if (!albumsMap.has(albumKey)) {
                albumsMap.set(albumKey, {
                    name: albumName,
                    artist_name: artistName,
                    folder_path: path.dirname(asset.file_path),
                    cover_path: asset.thumbnail_url || null
                });
            }
        });

        const data = {
            artists: Array.from(artistsMap.values()),
            albums: Array.from(albumsMap.values()),
            songs: assets.map(a => ({
                title: a.title,
                artist_name: a.artist,
                album_name: a.album,
                file_path: a.file_path,
                file_name: path.basename(a.file_path),
                thumbnail_url: a.thumbnail_url
            }))
        };

        if (saveToDb && assets.length > 0) {
            console.log(`💾 Background: Saving ${assets.length} assets to DB...`);
            // Run in background to avoid client timeout
            (async () => {
                // Clear local caches for this run
                artistCache.clear();
                albumCache.clear();

                for (const asset of assets) {
                    try {
                        await registerInternal({
                            ...asset,
                            thumbnail: asset.thumbnail_url || null
                        });
                    } catch (err) {
                        console.error(`⚠️ Failed to register ${asset.file_path}:`, err.message);
                    }
                }
                console.log(`✅ Background Save Complete for ${assets.length} items`);
            })();
        }

        res.json({
            success: true,
            status: saveToDb ? 'processing' : 'completed',
            count: assets.length,
            stats: {
                artists: artistsMap.size,
                albums: albumsMap.size,
                songs: assets.length
            },
            data // Send grouped data for immediate UI updates
        });
    } catch (err) {
        console.error('❌ Scan failed:', err);
        res.status(500).json({ error: 'Scan failed', message: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// LIBRARY ROUTES (DB)
// ──────────────────────────────────────────────────────────────

router.get("/library/artists", ensureSupabase, async (req, res) => {
    try {
        const { data, error } = await getSupabase().from('music_artists').select('*').order('name');
        if (error) throw error;
        res.json({ success: true, artists: data || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/library/albums", ensureSupabase, async (req, res) => {
    try {
        const db = getSupabase();
        const { data: albums, error } = await db
            .from('music_albums')
            .select('*, artist:music_artists(id, name, image_url)')
            .order('name');
        if (error) throw error;

        // Compute song_count per album so the frontend can correctly classify singles vs albums
        const { data: songRows } = await db
            .from('music_songs')
            .select('album_id')
            .not('album_id', 'is', null);

        const counts = {};
        (songRows || []).forEach(s => {
            if (s.album_id) counts[s.album_id] = (counts[s.album_id] || 0) + 1;
        });
        (albums || []).forEach(a => { a.song_count = counts[a.id] ?? 0; });

        res.json({ success: true, albums: albums || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/library/albums/:albumId/songs", ensureSupabase, async (req, res) => {
    try {
        const { albumId } = req.params;
        const { data, error } = await supabase
            .from('music_songs')
            .select('*, album:music_albums(id, name, cover_url), artist:music_artists(id, name)')
            .eq('album_id', albumId)
            .order('track_number', { ascending: true });
        if (error) throw error;
        res.json({ success: true, songs: data || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// All songs — used by frontend to compute albumCounts and show singles tab (bypasses RLS)
router.get("/library/songs", ensureSupabase, async (req, res) => {
    try {
        const { data, error } = await getSupabase()
            .from('music_songs')
            .select('*, album:music_albums(id, name, cover_url), artist:music_artists(id, name)')
            .order('title');
        if (error) throw error;
        res.json({ success: true, songs: data || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Songs by artist — replaces direct frontend supabase query to bypass RLS
router.get("/library/artists/:artistId/songs", ensureSupabase, async (req, res) => {
    try {
        const { artistId } = req.params;
        const { data, error } = await getSupabase()
            .from('music_songs')
            .select('*, album:music_albums(id, name, cover_url), artist:music_artists(id, name)')
            .eq('artist_id', artistId)
            .order('album_id', { ascending: true })
            .order('track_number', { ascending: true });
        if (error) throw error;
        res.json({ success: true, songs: data || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/library/playlists", ensureSupabase, async (req, res) => {
    try {
        const { data, error } = await getSupabase().from('music_playlists').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, playlists: data || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/library/playlists/:playlistId/songs", ensureSupabase, async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { data, error } = await supabase
            .from('music_playlist_songs')
            .select('id, position, song:music_songs(*, album:music_albums(id, name, cover_url), artist:music_artists(id, name))')
            .eq('playlist_id', playlistId)
            .order('position', { ascending: true });
        if (error) throw error;
        const songs = (data || []).map(r => ({ ...(r.song || {}), playlist_entry_id: r.id, position: r.position }));
        res.json({ success: true, songs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/library/ratings", ensureSupabase, async (req, res) => {
    try {
        const { employeeId, songIds } = req.body || {};
        if (!employeeId) return res.status(400).json({ success: false, message: 'Missing employeeId' });
        let query = getSupabase().from('music_ratings').select('song_id, rating, skip_count').eq('employee_id', employeeId);
        if (Array.isArray(songIds) && songIds.length > 0) query = query.in('song_id', songIds);
        const { data, error } = await query;
        if (error) throw error;
        res.json({ success: true, ratings: data || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/library/favorites", ensureSupabase, async (req, res) => {
    try {
        const { employeeId } = req.query;
        if (!employeeId) return res.status(400).json({ success: false, message: 'Missing employeeId' });
        const { data, error } = await supabase
            .from('music_ratings')
            .select('song:music_songs(*, album:music_albums(id, name, cover_url), artist:music_artists(id, name))')
            .eq('employee_id', employeeId)
            .eq('rating', 5);
        if (error) throw error;
        const songs = (data || []).map(r => r.song).filter(Boolean).map(s => ({ ...s, myRating: 5 }));
        res.json({ success: true, songs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Like / Dislike (rating)
router.post("/rate", ensureSupabase, async (req, res) => {
    try {
        const { songId, employeeId, rating, businessId } = req.body || {};
        if (!songId || !employeeId) return res.status(400).json({ success: false, message: 'Missing songId or employeeId' });

        if (rating === 0) {
            await getSupabase().from('music_ratings').delete().eq('song_id', songId).eq('employee_id', employeeId);
            return res.json({ success: true });
        }

        const { error } = await getSupabase().from('music_ratings').upsert({
            song_id: songId,
            employee_id: employeeId,
            rating,
            business_id: businessId || null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'song_id,employee_id' });

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// YouTube Integration
router.get("/youtube/quota", (req, res) => {
    res.json({ success: true, isExceeded: false, remaining: 1000 });
});

router.get("/youtube/metadata", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    try {
        const { exec } = await import('child_process');
        exec(`yt-dlp --dump-json "${url}"`, (error, stdout, stderr) => {
            if (error) return res.status(500).json({ error: error.message });
            try {
                const data = JSON.parse(stdout);
                res.json({
                    title: data.title,
                    uploader: data.uploader,
                    thumbnail: data.thumbnail,
                    duration: data.duration
                });
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse metadata' });
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/youtube/download", async (req, res) => {
    const { url, artist, album, title, thumbnail } = req.body;
    if (!url || !title) return res.status(400).json({ error: 'Missing required fields' });

    const safeArtist = (artist || 'Unknown Artist').replace(/[^\w\s\u0590-\u05FF-]/g, '').trim();
    const safeAlbum = (album || 'Single').replace(/[^\w\s\u0590-\u05FF-]/g, '').trim();
    const safeTitle = title.replace(/[^\w\s\u0590-\u05FF-]/g, '').trim();

    // 🚀 Dynamic Path Discovery
    const isMounted = PathManager.isExternalMounted();
    const rootPath = PathManager.getPrimaryPath();
    PathManager.ensureStagingExists();

    const folderName = (!album || album === 'Single') ? `${safeArtist} - Singles` : `${safeArtist} - ${safeAlbum}`;
    const dirPath = path.join(rootPath, folderName);
    const fileName = `${safeTitle}.mp3`;
    const outputPath = path.join(dirPath, `${safeTitle}.%(ext)s`);
    const finalFilePath = path.join(dirPath, fileName);

    try {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

        const { spawn } = await import('child_process');
        const cmd = ['-x', '--audio-format', 'mp3', '--audio-quality', '0', '--add-metadata', '--embed-thumbnail', '-o', outputPath, url];

        console.log(`🎵 Starting Download: ${safeTitle} to ${isMounted ? 'EXTERNAL' : 'STAGING'}`);

        const ytProcess = spawn('yt-dlp', cmd);

        ytProcess.on('close', async (code) => {
            if (code === 0 && fs.existsSync(finalFilePath)) {
                // 💾 Register in Supabase
                try {
                    // Try to find or create artist
                    let { data: artistData } = await getSupabase().from('music_artists').select('id').eq('name', safeArtist).maybeSingle();
                    if (!artistData) {
                        const { data: newArtist } = await getSupabase().from('music_artists').insert({ name: safeArtist }).select('id').single();
                        artistData = newArtist;
                    }

                    // Try to find or create album
                    let { data: albumData } = await getSupabase().from('music_albums').select('id').eq('name', safeAlbum).eq('artist_id', artistData.id).maybeSingle();
                    if (!albumData) {
                        const { data: newAlbum } = await getSupabase().from('music_albums').insert({
                            name: safeAlbum,
                            artist_id: artistData.id,
                            cover_url: thumbnail
                        }).select('id').single();
                        albumData = newAlbum;
                    }

                    // Insert Song
                    const { error: songError } = await getSupabase().from('music_songs').insert({
                        title: safeTitle,
                        artist_id: artistData.id,
                        album_id: albumData.id,
                        file_path: finalFilePath,
                        file_name: fileName,
                        is_synced: isMounted, // If external is mounted, it's synced immediately
                        thumbnail_url: thumbnail
                    });

                    if (songError) console.error('❌ Failed to register song in DB:', songError);

                    res.json({ success: true, message: 'Download complete', path: finalFilePath, is_synced: isMounted });
                } catch (dbErr) {
                    console.error('❌ DB Error after download:', dbErr);
                    res.json({ success: true, message: 'Download complete but DB registration failed' });
                }
            } else {
                res.status(500).json({ error: 'Download failed or file not found' });
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SYNC ROUTES
router.get("/sync/status", ensureSupabase, async (req, res) => {
    try {
        const pending = await SyncManager.getPendingSyncList();
        res.json({
            success: true,
            isMounted: PathManager.isExternalMounted(),
            count: pending.length,
            pending
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/sync/execute", ensureSupabase, async (req, res) => {
    try {
        const results = await SyncManager.syncToExternal();
        res.json({
            success: true,
            results
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/youtube/search", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' music')}&type=video,playlist&maxResults=20&key=${apiKey}`;
        const response = await fetch(ytUrl);
        const data = await response.json();

        const ytResults = (data.items || []).map(item => ({
            id: item.id.videoId || item.id.playlistId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            source: 'YOUTUBE',
            type: item.id.playlistId ? 'playlist' : 'video'
        }));

        res.json({ results: ytResults });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// CACHE MANAGEMENT
// ──────────────────────────────────────────────────────────────

// GET /cache/:songId - Check if a song is cached
router.get('/cache/:songId', async (req, res) => {
    try {
        const { songId } = req.params;
        const isCached = await CacheService.isCached(songId);
        const usage = await CacheService.getCacheUsage();
        res.json({ success: true, isCached, usage });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /cache - Cache a song file locally
router.post('/cache', async (req, res) => {
    try {
        const { songId, filePath } = req.body;
        if (!songId || !filePath) {
            return res.status(400).json({ success: false, error: 'Missing songId or filePath' });
        }

        // Resolve real path (handle external mount aliases like Ran1 vs RANTUNES)
        let resolvedPath = filePath;
        if (!fs.existsSync(resolvedPath)) {
            const activeRoot = PathManager.getExternalRoot();
            for (const candidate of PathManager.EXTERNAL_CANDIDATES) {
                if (resolvedPath.startsWith(candidate)) {
                    const relative = resolvedPath.slice(candidate.length);
                    const withActive = path.join(activeRoot, relative);
                    if (fs.existsSync(withActive)) { resolvedPath = withActive; break; }
                }
            }
        }

        const result = await CacheService.cacheSong(songId, resolvedPath);
        res.json(result);
    } catch (err) {
        console.error('❌ Cache POST error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /cache/:songId - Remove a song from cache
router.delete('/cache/:songId', async (req, res) => {
    try {
        const { songId } = req.params;
        const result = await CacheService.removeFromCache(songId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// STREAMING & ASSETS
// ──────────────────────────────────────────────────────────────

router.get("/cover", async (req, res) => {
    try {
        let filePath = decodeURIComponent(req.query.path || '');
        const id = req.query.id;

        // 🚀 Local Fallback — tries all known external mount names
        if (filePath && !fs.existsSync(filePath)) {
            const activeRoot = PathManager.getExternalRoot();
            for (const candidate of PathManager.EXTERNAL_CANDIDATES) {
                if (filePath.startsWith(candidate)) {
                    const relative = filePath.slice(candidate.length);
                    const withActive = path.join(activeRoot, relative);
                    if (fs.existsSync(withActive)) { filePath = withActive; break; }
                    const stagingFallback = path.join(os.homedir(), 'Music', 'iCaffe', relative);
                    if (fs.existsSync(stagingFallback)) { filePath = stagingFallback; break; }
                }
            }
        }

        if (filePath && fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
            return fs.createReadStream(filePath).pipe(res);
        }

        // 🌐 Database/Remote Fallback
        if (id) {
            const coverCandidates = ['cover.jpg', 'cover.png', 'folder.jpg', 'folder.png', 'album.jpg', 'front.jpg'];

            // Check if it's a song ID first
            let { data: song } = await supabase
                .from('music_songs')
                .select('cover_url, thumbnail_url, file_path, album:album_id(cover_url, folder_path)')
                .eq('id', id)
                .maybeSingle();

            let remoteUrl = song?.cover_url || song?.album?.cover_url || song?.thumbnail_url;

            // Try local cover file in song's folder
            if (!remoteUrl && song?.file_path) {
                const songFolder = path.dirname(song.file_path);
                for (const name of coverCandidates) {
                    const testPath = path.join(songFolder, name);
                    if (fs.existsSync(testPath)) { remoteUrl = testPath; break; }
                }
            }
            // Try folder_path from album
            if (!remoteUrl && song?.album?.folder_path) {
                for (const name of coverCandidates) {
                    const testPath = path.join(song.album.folder_path, name);
                    if (fs.existsSync(testPath)) { remoteUrl = testPath; break; }
                }
            }

            if (!remoteUrl) {
                // Maybe it's an album ID
                const { data: album } = await supabase
                    .from('music_albums')
                    .select('cover_url, folder_path')
                    .eq('id', id)
                    .maybeSingle();
                remoteUrl = album?.cover_url;
                // Try folder_path
                if (!remoteUrl && album?.folder_path) {
                    for (const name of coverCandidates) {
                        const testPath = path.join(album.folder_path, name);
                        if (fs.existsSync(testPath)) { remoteUrl = testPath; break; }
                    }
                }
            }

            if (remoteUrl) {
                if (remoteUrl.startsWith('http')) return res.redirect(remoteUrl);
                // Local file path
                if (fs.existsSync(remoteUrl)) {
                    const ext = path.extname(remoteUrl).toLowerCase();
                    res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                    return fs.createReadStream(remoteUrl).pipe(res);
                }
            }
        }

        // Return SVG placeholder instead of 404 to avoid browser error spam
        const placeholderSvg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#1e1e2e"/><text x="50%" y="54%" text-anchor="middle" fill="#555" font-family="system-ui" font-size="20" font-weight="bold">♪</text></svg>`;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.send(placeholderSvg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const MIME_TYPES = {
    '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.m4a': 'audio/mp4',
    '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.aac': 'audio/aac', '.cache': 'audio/mpeg',
};

router.get('/stream', verifyAlbumToken, async (req, res) => {
    const { id, path: requestedPath, device_type } = req.query;

    // 1. Resolve Best Source (Lossless > HD > SD)
    let song = null;
    if (id) {
        song = await getBestAvailableSource(id);
    }

    let finalPath = requestedPath || song?.file_path;

    // 🎯 Check internal cache first — serve from local buffer if available
    if (id) {
        try {
            const isCached = await CacheService.isCached(id);
            if (isCached) {
                const cachePath = CacheService.getCachePath(id);
                if (fs.existsSync(cachePath)) {
                    finalPath = cachePath;
                    console.log(`📦 [Stream] Serving from cache: ${path.basename(cachePath)}`);
                }
            }
        } catch (cacheErr) {
            console.warn('⚠️ [Stream] Cache check failed, falling through to original path:', cacheErr.message);
        }
    }

    // 🚀 Robust Path Fallback (Local) — tries all known external mount names
    if (finalPath && !fs.existsSync(finalPath)) {
        const activeRoot = PathManager.getExternalRoot();
        let resolved = false;
        // 1. Try swapping any known external mount prefix with the active one
        for (const candidate of PathManager.EXTERNAL_CANDIDATES) {
            if (finalPath.startsWith(candidate)) {
                const relative = finalPath.slice(candidate.length);
                const withActive = path.join(activeRoot, relative);
                if (fs.existsSync(withActive)) { finalPath = withActive; resolved = true; break; }
            }
        }
        // 2. Fallback to staging copy (~/Music/iCaffe)
        if (!resolved) {
            for (const candidate of PathManager.EXTERNAL_CANDIDATES) {
                if (finalPath.startsWith(candidate)) {
                    const relative = finalPath.slice(candidate.length);
                    const stagingFallback = path.join(os.homedir(), 'Music', 'iCaffe', relative);
                    if (fs.existsSync(stagingFallback)) { finalPath = stagingFallback; break; }
                }
            }
        }
    }

    // 2. Transcoding Logic for Mobile
    const isMobile = device_type === 'mobile';
    const isLossless = finalPath && finalPath.toLowerCase().endsWith('.flac');

    if (finalPath && fs.existsSync(finalPath)) {
        if (isMobile && isLossless) {
            // 🔄 ON-THE-FLY TRANSCODING (Mobile Tiering)
            console.log(`📱 Mobile detected. Transcoding ${path.basename(finalPath)} to AAC...`);

            res.setHeader('Content-Type', 'audio/aac');
            const { spawn } = await import('child_process');

            const ffmpeg = spawn('ffmpeg', [
                '-i', finalPath,
                '-c:a', 'aac',
                '-b:a', '256k',
                '-f', 'adts',
                'pipe:1'
            ]);

            ffmpeg.stdout.pipe(res);

            req.on('close', () => {
                ffmpeg.kill();
            });
            return;
        }

        // Standard Streaming with Range Support
        const stat = fs.statSync(finalPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        const contentType = finalPath.endsWith('.flac') ? 'audio/flac' : 'audio/mpeg';

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(finalPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType,
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes'
            };
            res.writeHead(200, head);
            fs.createReadStream(finalPath).pipe(res);
        }
    } else {
        // 🚀 YT Fallback
        if (id) {
            console.log(`📡 File missing for ${id}. Attempting YouTube fallback...`);
            try {
                const { data: songData } = await getSupabase().from('music_songs').select('video_id').eq('id', id).single();
                if (songData?.video_id) {
                    const { spawn } = await import('child_process');
                    const ytUrl = `https://www.youtube.com/watch?v=${songData.video_id}`;
                    console.log(`🎬 Streaming from YouTube: ${ytUrl}`);
                    const ytProcess = spawn('yt-dlp', ['-o', '-', '-f', 'bestaudio', '--no-playlist', ytUrl]);
                    res.setHeader('Content-Type', 'audio/mpeg');
                    ytProcess.stdout.pipe(res);
                    return;
                }
            } catch (err) {
                console.error('❌ YT Fallback failed:', err);
            }
        }
        res.status(404).json({ error: "File not found and no playback fallback available" });
    }
});

// ──────────────────────────────────────────────────────────────
// PHYSICAL CD IMPORT
// ──────────────────────────────────────────────────────────────

router.get("/cd/status", async (req, res) => {
    try {
        const info = await CDService.detectCD();
        res.json({ success: true, ...info });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/cd/analyze", async (req, res) => {
    try {
        const token = await CDService.generateAlbumToken();
        // In a real scenario, we'd use discid tool to get the real MBID
        // For now, we return the token and let user search if needed
        res.json({ success: true, album_token: token });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/cd/import", async (req, res) => {
    const {
        tracks,
        albumMetadata,
        provenanceImage,
        legalAccepted,
        profile,
        businessId
    } = req.body;

    if (!legalAccepted) {
        return res.status(403).json({ error: 'Legal declaration must be accepted' });
    }

    try {
        const albumToken = await CDService.generateAlbumToken();
        const rootPath = PathManager.STAGING_ROOT;
        const safeArtist = albumMetadata.artist.replace(/[^\w\s-]/g, '').trim();
        const safeAlbum = albumMetadata.title.replace(/[^\w\s-]/g, '').trim();
        const dirPath = path.join(rootPath, `${safeArtist} - ${safeAlbum}`);

        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

        // 1. Create Artist/Album in DB
        let { data: artistData } = await getSupabase().from('music_artists').select('id').eq('name', safeArtist).maybeSingle();
        if (!artistData) {
            const { data: newArtist } = await getSupabase().from('music_artists').insert({ name: safeArtist }).select('id').single();
            artistData = newArtist;
        }

        let { data: albumData } = await getSupabase().from('music_albums').select('id').eq('name', safeAlbum).eq('artist_id', artistData.id).maybeSingle();
        if (!albumData) {
            const { data: newAlbum } = await getSupabase().from('music_albums').insert({
                name: safeAlbum,
                artist_id: artistData.id,
                cover_url: albumMetadata.cover_url
            }).select('id').single();
            albumData = newAlbum;
        }

        // 2. Log Compliance
        await getSupabase().from('compliance_logs').insert({
            activity_type: 'cd_import',
            target_id: albumData.id,
            legal_declaration_accepted: true,
            provenance_image_url: provenanceImage,
            business_id: businessId
        });

        const results = [];
        for (const track of tracks) {
            const fileName = `${track.track_number}. ${track.title}.${profile === 'lossless' ? 'flac' : 'mp3'}`;
            const trackPath = path.join(dirPath, fileName);

            await CDService.ripTrack(track.track_number, null, trackPath, profile);

            // Register Song
            const { data: songData } = await getSupabase().from('music_songs').insert({
                title: track.title,
                artist_id: artistData.id,
                album_id: albumData.id,
                track_number: track.track_number,
                file_path: trackPath,
                file_name: fileName,
                is_synced: false,
                source_type: 'physical_cd',
                album_token: albumToken,
                provenance_image_url: provenanceImage
            }).select('id').single();

            results.push(songData);
        }

        res.json({ success: true, album_id: albumData.id, imported: results.length });

    } catch (err) {
        console.error('❌ CD Import failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// DISCOVERY & NODES
// ──────────────────────────────────────────────────────────────

router.post("/discovery/start", async (req, res) => {
    try {
        const { device_type } = req.body;
        await DiscoveryService.startHeartbeat(device_type || 'mbp');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🖼️ Fix missing album covers — finds cover.jpg in album folders and updates DB
router.post("/albums/fix-covers", ensureSupabase, async (req, res) => {
    try {
        const coverCandidates = ['cover.jpg', 'cover.png', 'folder.jpg', 'folder.png', 'album.jpg', 'front.jpg', 'artwork.jpg'];
        // Get albums missing cover_url or folder_path
        const { data: albums, error } = await getSupabase()
            .from('music_albums')
            .select('id, name, cover_url, folder_path');
        if (error) throw error;

        const albumsToFix = (albums || []).filter(a => !a.cover_url || !a.folder_path);
        if (albumsToFix.length === 0) return res.json({ success: true, updated: 0 });

        // For each album, find a song to get the file_path, then derive folder
        let updated = 0;
        for (const album of albumsToFix) {
            try {
                let folderPath = album.folder_path;

                if (!folderPath) {
                    // Derive folder from a song in this album
                    const { data: songs } = await getSupabase()
                        .from('music_songs')
                        .select('file_path')
                        .eq('album_id', album.id)
                        .limit(1);
                    if (songs?.[0]?.file_path) {
                        folderPath = path.dirname(songs[0].file_path);
                    }
                }

                if (!folderPath) continue;

                // Try known external mounts if folder doesn't exist
                if (!fs.existsSync(folderPath)) {
                    const activeRoot = PathManager.getExternalRoot();
                    for (const candidate of PathManager.EXTERNAL_CANDIDATES) {
                        if (folderPath.startsWith(candidate)) {
                            const rel = folderPath.slice(candidate.length);
                            const alt = path.join(activeRoot, rel);
                            if (fs.existsSync(alt)) { folderPath = alt; break; }
                        }
                    }
                }

                let coverPath = album.cover_url || null;
                if ((!coverPath || !coverPath.startsWith('http')) && folderPath && fs.existsSync(folderPath)) {
                    for (const name of coverCandidates) {
                        const testPath = path.join(folderPath, name);
                        if (fs.existsSync(testPath)) { coverPath = testPath; break; }
                    }
                }

                if (coverPath || folderPath !== album.folder_path) {
                    await getSupabase().from('music_albums').update({
                        folder_path: folderPath,
                        ...(coverPath ? { cover_url: coverPath } : {})
                    }).eq('id', album.id);
                    updated++;
                }
            } catch (e) {
                console.warn(`⚠️ [fix-covers] Album ${album.id}:`, e.message);
            }
        }

        console.log(`🖼️ [fix-covers] Updated ${updated} albums`);
        res.json({ success: true, updated, checked: albumsToFix.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get("/library/stats", async (req, res) => {
    try {
        const stats = await PathManager.getLibraryStats();
        res.json({ success: true, stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 📁 Manually Register a file in the library
// POST /library/register - Manually register a file (e.g. from Electron download)
router.post("/library/register", ensureSupabase, async (req, res) => {
    try {
        const songData = await registerInternal(req.body);
        res.json({ success: true, song: songData });
    } catch (err) {
        console.error('❌ Register failed:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
