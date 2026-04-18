import express from 'express';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import * as mm from 'music-metadata';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const AUDIO_EXTS = new Set(['.mp3', '.flac', '.m4a', '.aac', '.ogg', '.wav']);
const PRIORITY_COVERS = ['cover.jpg', 'folder.jpg', 'album.jpg', 'cover.png', 'folder.png', 'front.jpg', 'artwork.jpg'];

/** Find any cover image in a local folder (priority names first, then any image) */
function findCoverInFolder(folderPath) {
    if (!folderPath || !existsSync(folderPath)) return null;
    try {
        const files = readdirSync(folderPath);
        for (const name of PRIORITY_COVERS) {
            const match = files.find(f => f.toLowerCase() === name);
            if (match) return path.join(folderPath, match);
        }
        const anyImg = files.find(f => !f.startsWith('.') && IMAGE_EXTS.has(path.extname(f).toLowerCase()));
        if (anyImg) return path.join(folderPath, anyImg);
    } catch (_) {}
    return null;
}

/** Extract embedded artwork from the first audio file found in a folder */
async function extractEmbeddedArt(folderPath) {
    if (!folderPath || !existsSync(folderPath)) return null;
    try {
        const files = readdirSync(folderPath);
        const audioFile = files.find(f => !f.startsWith('.') && AUDIO_EXTS.has(path.extname(f).toLowerCase()));
        if (!audioFile) return null;
        const meta = await mm.parseFile(path.join(folderPath, audioFile), { duration: false, skipCovers: false });
        const pic = meta.common?.picture?.[0];
        if (pic?.data?.length > 0) return { data: pic.data, mime: pic.format || 'image/jpeg' };
    } catch (_) {}
    return null;
}

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
router.get('/', async (req, res) => {
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

                // Path given but file missing — try the folder for any cover image
                const folder = path.dirname(safePath);
                const folderCover = findCoverInFolder(folder);
                if (folderCover) {
                    const ext = path.extname(folderCover).toLowerCase();
                    const ct = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
                    res.setHeader('Content-Type', ct);
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                    res.send(await fs.readFile(folderCover));
                    return;
                }

                // Last resort: embedded ID3 artwork
                const embedded = await extractEmbeddedArt(folder);
                if (embedded) {
                    res.setHeader('Content-Type', embedded.mime);
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                    return res.send(embedded.data);
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

                // Helper: serve a local file path
                const serveLocal = async (filePath) => {
                    const ext = path.extname(filePath).toLowerCase();
                    const ct = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
                    res.setHeader('Content-Type', ct);
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                    res.send(await fs.readFile(filePath));
                    return true;
                };

                // 1. Try cover_url stored on song/album (may be local path or http)
                if (remoteUrl) {
                    if (remoteUrl.startsWith('http')) return res.redirect(remoteUrl);
                    if (existsSync(remoteUrl)) return serveLocal(remoteUrl);
                }

                // 2. Search album folder for any cover image
                if (localFolder) {
                    const found = findCoverInFolder(localFolder);
                    if (found) return serveLocal(found);

                    // 3. Try parent folder (for compilation sub-artist folders)
                    const parentFolder = path.dirname(localFolder);
                    if (parentFolder !== localFolder) {
                        const parentFound = findCoverInFolder(parentFolder);
                        if (parentFound) return serveLocal(parentFound);
                    }

                    // 4. Extract embedded artwork from first audio file
                    const embeddedArt = await extractEmbeddedArt(localFolder);
                    if (embeddedArt) {
                        res.setHeader('Content-Type', embeddedArt.mime);
                        res.setHeader('Cache-Control', 'public, max-age=86400');
                        return res.send(embeddedArt.data);
                    }
                }

                // If not found in songs, try albums directly
                const { data: album } = await client
                    .from('music_albums')
                    .select('cover_url, folder_path')
                    .eq('id', id)
                    .maybeSingle();

                if (album) {
                    if (album.cover_url?.startsWith('http')) return res.redirect(album.cover_url);
                    if (album.cover_url && existsSync(album.cover_url)) return serveLocal(album.cover_url);
                    // Try folder search for album directly
                    if (album.folder_path) {
                        const found = findCoverInFolder(album.folder_path);
                        if (found) return serveLocal(found);
                        const embedded = await extractEmbeddedArt(album.folder_path);
                        if (embedded) {
                            res.setHeader('Content-Type', embedded.mime);
                            res.setHeader('Cache-Control', 'public, max-age=86400');
                            return res.send(embedded.data);
                        }
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
