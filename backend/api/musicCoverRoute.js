import express from 'express';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const router = express.Router();

// Lazy Supabase client initialization
let supabase = null;
function getSupabaseClient() {
    if (supabase) return supabase;

    // Prioritize local for speed and offline support, fallback to remote
    const localUrl = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
    const localKey = process.env.LOCAL_SUPABASE_SERVICE_KEY;
    const remoteUrl = process.env.SUPABASE_URL;
    const remoteKey = process.env.SUPABASE_SERVICE_KEY;

    // Detection logic
    const useLocal = localUrl && localKey; // Simple check for now
    const url = useLocal ? localUrl : remoteUrl;
    const key = useLocal ? localKey : remoteKey;

    if (!url || !key) {
        throw new Error('Supabase credentials required for music cover routes');
    }

    supabase = createClient(url, key);
    console.log(`✅ [MusicCover] Supabase ready (${useLocal ? 'LOCAL' : 'REMOTE'} mode)`);
    return supabase;
}

/**
 * GET /music/cover
 * Returns album cover image or track thumbnail
 */
router.get('/cover', async (req, res) => {
    console.log(`🔌 [MusicCover] Request received: id=${req.query.id}, path=${req.query.path}`);
    try {
        const { id, path: coverPath } = req.query;

        // 1. Stream from local file system if path provided
        if (coverPath) {
            try {
                // Security: prevent directory traversal
                const safePath = path.normalize(decodeURIComponent(coverPath)).replace(/^(\.\.[\/\\])+/, '');

                if (existsSync(safePath)) {
                    const ext = path.extname(safePath).toLowerCase();
                    const contentType = {
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.png': 'image/png',
                        '.webp': 'image/webp',
                        '.gif': 'image/gif'
                    }[ext] || 'image/jpeg';

                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Cache-Control', 'public, max-age=86400');

                    const fileBuffer = await fs.readFile(safePath);
                    return res.send(fileBuffer);
                }
            } catch (fileError) {
                console.warn(`⚠️ [MusicCover] Local file access failed: ${coverPath}`);
            }
        }

        // 2. Lookup in Database if ID provided
        if (id && id.length > 10) { // basic UUID check
            try {
                const client = getSupabaseClient();

                // Check music_songs first (for tracks)
                const { data: song } = await client
                    .from('music_songs')
                    .select('cover_url, file_path, album:music_albums(cover_url, folder_path)')
                    .eq('id', id)
                    .maybeSingle();

                let remoteUrl = song?.cover_url || song?.album?.cover_url;
                let localFolder = song?.album?.folder_path;

                // Fallback: If no cover_url, look for common image files in the album folder
                if (!remoteUrl && localFolder && existsSync(localFolder)) {
                    const commonNames = ['cover.jpg', 'folder.jpg', 'album.jpg', 'cover.png', 'folder.png'];
                    for (const name of commonNames) {
                        const testPath = path.join(localFolder, name);
                        if (existsSync(testPath)) {
                            res.setHeader('Content-Type', name.endsWith('png') ? 'image/png' : 'image/jpeg');
                            const fileBuffer = await fs.readFile(testPath);
                            return res.send(fileBuffer);
                        }
                    }
                }

                if (remoteUrl) {
                    if (remoteUrl.startsWith('http')) {
                        return res.redirect(remoteUrl);
                    }
                    if (existsSync(remoteUrl)) {
                        const ext = path.extname(remoteUrl).toLowerCase();
                        res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
                        const fileBuffer = await fs.readFile(remoteUrl);
                        return res.send(fileBuffer);
                    }
                }

                // If not found in songs, try albums directly
                const { data: album } = await client
                    .from('music_albums')
                    .select('cover_url, folder_path')
                    .eq('id', id)
                    .maybeSingle();

                if (album?.cover_url) {
                    if (album.cover_url.startsWith('http')) return res.redirect(album.cover_url);
                    if (existsSync(album.cover_url)) {
                        const ext = path.extname(album.cover_url).toLowerCase();
                        res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
                        const fileBuffer = await fs.readFile(album.cover_url);
                        return res.send(fileBuffer);
                    }
                }
            } catch (dbError) {
                console.error('❌ [MusicCover] DB Lookup Error:', dbError.message);
            }
        }

        // 3. Last Fallback: SVG Placeholder
        const placeholderSvg = `
            <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="300" fill="#1e1e2e"/>
                <text x="50%" y="54%" text-anchor="middle" fill="#555" font-family="system-ui" font-size="20" font-weight="bold">
                    No Cover Art
                </text>
                <circle cx="150" cy="120" r="40" fill="none" stroke="#333" stroke-width="2"/>
                <path d="M130 140 Q 150 160 170 140" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.send(placeholderSvg);

    } catch (err) {
        console.error('❌ [MusicCover] Critical Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
