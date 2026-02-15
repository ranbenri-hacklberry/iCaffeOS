/**
 * Music API Routes
 *
 * Provides endpoints for:
 *   POST /api/music/scan   → Triggers a local directory scan, returns asset metadata as JSON
 *   GET  /api/music/stream → Streams an audio file by path (used by LocalProvider on the frontend)
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { LocalAssetScanner } from '../localAssetScanner.js';
import { CacheService } from '../services/cacheService.js';

const router = express.Router();

// ──────────────────────────────────────────────────────────────
// POST /api/music/scan
// Scans the configured music directory and returns metadata array.
// The frontend receives this JSON and does `local_assets.bulkPut(data)`.
// ──────────────────────────────────────────────────────────────
let scanInProgress = false;

router.post('/scan', async (req, res) => {
    if (scanInProgress) {
        return res.status(409).json({ error: 'Scan already in progress' });
    }

    scanInProgress = true;

    try {
        // Allow override from request body (e.g. for testing)
        const rootPath = req.body?.path || undefined;
        const scanner = new LocalAssetScanner(rootPath);
        const assets = await scanner.scan();

        res.json({
            success: true,
            count: assets.length,
            assets
        });
    } catch (err) {
        console.error('❌ Scan failed:', err);
        res.status(500).json({ error: 'Scan failed', message: err.message });
    } finally {
        scanInProgress = false;
    }
});

// ──────────────────────────────────────────────────────────────
// TIERED STORAGE ENDPOINTS
// ──────────────────────────────────────────────────────────────

// GET /api/music/cache/stats
router.get('/cache/stats', async (req, res) => {
    try {
        const usage = await CacheService.getCacheUsage();
        res.json({ success: true, usageBytes: usage, limitBytes: 10 * 1024 * 1024 * 1024 });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/music/cache
// Body: { songId, filePath }
router.post('/cache', async (req, res) => {
    const { songId, filePath } = req.body;
    if (!songId || !filePath) return res.status(400).json({ error: 'Missing songId or filePath' });

    try {
        const result = await CacheService.cacheSong(songId, filePath);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/music/cache/:songId
router.delete('/cache/:songId', async (req, res) => {
    try {
        const result = await CacheService.removeFromCache(req.params.songId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// ──────────────────────────────────────────────────────────────
// GET /api/music/stream?path=/Volumes/Ran1/Music/Artist/song.mp3&id=local_123
// Streams the audio file with proper headers for HTML5 Audio.
// Supports Range requests for seeking.
// Falls back to path if id is not cached.
// ──────────────────────────────────────────────────────────────
const MIME_TYPES = {
    '.mp3': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
    '.cache': 'audio/mpeg', // Cache files are stored with .cache but are original format
};

router.get('/stream', async (req, res) => {
    const filePath = req.query.path;
    const songId = req.query.id;

    if (!filePath && !songId) {
        return res.status(400).json({ error: 'Missing "path" or "id" query parameter' });
    }

    let finalPath = filePath;

    // TIERED STORAGE LOGIC: Check internal cache first if ID is provided
    if (songId) {
        const cachedPath = CacheService.getCachePath(songId);
        try {
            await fs.promises.access(cachedPath);
            finalPath = cachedPath;
            // console.log(`🚀 Streaming ${songId} from internal cache`);
        } catch (err) {
            // Not cached, or error accessing cache - fall back to external path
            if (!filePath) {
                return res.status(404).json({ error: 'Song not cached and no backup path provided' });
            }
            // console.log(`⚠️ Falling back to external path for ${songId}`);
        }
    }

    // Basic security: prevent path traversal to sensitive areas
    const resolved = path.resolve(finalPath);
    if (resolved.includes('..') && !resolved.includes('music_cache')) {
        return res.status(403).json({ error: 'Invalid path' });
    }

    try {
        const stat = fs.statSync(resolved);
        const ext = path.extname(resolved).toLowerCase();
        let contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // If it's a .cache file, we need to infer the real type if possible, or just use mpeg as default
        if (ext === '.cache' && filePath) {
            const originalExt = path.extname(filePath).toLowerCase();
            contentType = MIME_TYPES[originalExt] || 'audio/mpeg';
        }

        const fileSize = stat.size;

        // Handle Range requests (for seeking in the audio player)
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            const stream = fs.createReadStream(resolved, { start, end });
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': contentType,
            });
            stream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes',
            });
            fs.createReadStream(resolved).pipe(res);
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.status(404).json({ error: 'File not found', path: finalPath });
        }
        console.error('❌ Stream error:', err);
        res.status(500).json({ error: 'Stream failed', message: err.message });
    }
});

export default router;
