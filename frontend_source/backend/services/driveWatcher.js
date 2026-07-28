/**
 * RanTunes Drive Watcher
 * Polls every 3 seconds to detect RANTUNES drive mount/eject events.
 * On mount: triggers full library scan → Supabase upsert → WS broadcast.
 * On eject: stops playback from drive, broadcasts DRIVE_EJECTED event.
 * 
 * Strategy: Poll over FSEvents — simpler, more reliable for volume mount/unmount on macOS.
 */

import fs from 'fs';
import path from 'path';
import { LocalAssetScanner } from '../localAssetScanner.js';
import { PathManager } from '../utils/pathManager.js';
import { createClient } from '@supabase/supabase-js';

// Supabase client — prefers local instance (same strategy as musicRoutes.js)
function getSupabase() {
    const localUrl = process.env.LOCAL_SUPABASE_URL || process.env.VITE_LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
    const localKey = process.env.LOCAL_SUPABASE_SERVICE_KEY || process.env.LOCAL_SUPABASE_KEY || process.env.VITE_LOCAL_SUPABASE_ANON_KEY;
    const remoteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const remoteKey = process.env.VITE_SUPABASE_SERVICE_KEY
        || process.env.SUPABASE_SERVICE_ROLE_KEY
        || process.env.SUPABASE_SERVICE_KEY
        || process.env.VITE_SUPABASE_ANON_KEY;

    const url = (localUrl && localKey) ? localUrl : remoteUrl;
    const key = localKey || remoteKey;

    if (!url || !key) {
        console.warn('[DriveWatcher] Supabase credentials missing — DB sync disabled');
        return null;
    }

    console.log(`[DriveWatcher] Supabase → Connected using ${localKey ? 'LOCAL' : 'REMOTE'} key`);
    return createClient(url, key);
}

const POLL_INTERVAL_MS = 3000;

export class DriveWatcher {
    /**
     * @param {import('./rantunesWsServer.js').RantunesWsServer} wsServer
     */
    constructor(wsServer) {
        this._wsServer = wsServer;
        this._supabase = getSupabase();
        this._activeMountPath = PathManager.getActiveExternalRoot();
        this._pollTimer = null;
        this._isScanning = false; // Prevent overlapping scans
    }

    // ─────────────────────────────────────────────
    //  LIFECYCLE
    // ─────────────────────────────────────────────

    start() {
        console.log(`🔍 [DriveWatcher] Starting — polling every ${POLL_INTERVAL_MS / 1000}s`);
        console.log(`   Initial drive state: ${this._activeMountPath ? `✅ MOUNTED at ${this._activeMountPath}` : '❌ Not mounted'}`);

        // If already mounted at startup, trigger an immediate scan
        if (this._activeMountPath) {
            console.log(`🚀 [DriveWatcher] Drive already present at startup — triggering scan at: ${this._activeMountPath}`);
            this._onMount(this._activeMountPath);
        }

        this._pollTimer = setInterval(() => this._poll(), POLL_INTERVAL_MS);
    }

    stop() {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
        console.log('[DriveWatcher] Stopped');
    }

    // ─────────────────────────────────────────────
    //  POLLING LOGIC
    // ─────────────────────────────────────────────

    _poll() {
        const currentMountPath = PathManager.getActiveExternalRoot();

        if (currentMountPath && !this._activeMountPath) {
            // ── MOUNT DETECTED ──
            this._activeMountPath = currentMountPath;
            console.log(`\n🎵 [DriveWatcher] RANTUNES drive MOUNTED at: ${currentMountPath}`);
            this._onMount(currentMountPath);
        } else if (!currentMountPath && this._activeMountPath) {
            // ── EJECT DETECTED ──
            console.log(`\n💿 [DriveWatcher] RANTUNES drive EJECTED (previously: ${this._activeMountPath})`);
            this._activeMountPath = null;
            this._onEject();
        } else if (currentMountPath && this._activeMountPath && currentMountPath !== this._activeMountPath) {
            // ── ACTIVE MOUNT PATH CHANGED (e.g. from RanTunesBackup to RANTUNES because RANTUNES is higher priority!) ──
            console.log(`\n🔄 [DriveWatcher] Active mount path changed: ${this._activeMountPath} -> ${currentMountPath}`);
            this._activeMountPath = currentMountPath;
            this._onMount(currentMountPath);
        }
    }

    // ─────────────────────────────────────────────
    //  MOUNT HANDLER
    // ─────────────────────────────────────────────

    async _onMount(mountPath) {
        if (this._isScanning) {
            console.log('[DriveWatcher] Scan already in progress — skipping');
            return;
        }

        this._isScanning = true;

        try {
            console.log('📂 [DriveWatcher] Starting library scan...');

            const scanner = new LocalAssetScanner(mountPath);
            const tracks = await scanner.scan();

            console.log(`✅ [DriveWatcher] Scan complete: ${tracks.length} tracks found`);

            if (tracks.length === 0) {
                console.warn('[DriveWatcher] No tracks found — skipping DB sync');
                this._wsServer?.broadcastLibraryUpdated({ artists: 0, albums: 0, songs: 0 });
                return;
            }

            // Sync to Supabase
            const stats = await this._syncToSupabase(tracks);

            // Broadcast to all WS clients
            this._wsServer?.broadcastLibraryUpdated(stats);

            console.log(`🎵 [DriveWatcher] Library synced: ${stats.artists} artists, ${stats.albums} albums, ${stats.songs} songs`);
        } catch (err) {
            console.error('[DriveWatcher] Mount scan failed:', err.message);
        } finally {
            this._isScanning = false;
        }
    }

    // ─────────────────────────────────────────────
    //  EJECT HANDLER
    // ─────────────────────────────────────────────

    async _onEject() {
        this._wsServer?.broadcastDriveEjected();

        // Mark all drive-based songs as unavailable in DB
        if (this._supabase) {
            try {
                // Match any path that starts with a known /Volumes/ candidate
                const { error } = await this._supabase
                    .from('music_songs')
                    .update({ is_available: false, updated_at: new Date().toISOString() })
                    .like('file_path', '/Volumes/%');

                if (error) throw error;
                console.log('💾 [DriveWatcher] Marked all /Volumes/* songs as is_available=false');
            } catch (err) {
                console.warn('[DriveWatcher] Failed to update is_available on eject:', err.message);
            }
        }
        // Note: We intentionally do NOT delete DB rows — songs remain in library but flagged unavailable.
    }

    // ─────────────────────────────────────────────
    //  SUPABASE SYNC
    // ─────────────────────────────────────────────

    async _syncToSupabase(tracks) {
        if (!this._supabase) {
            console.warn('[DriveWatcher] No Supabase client — skipping DB sync');
            return { artists: 0, albums: 0, songs: tracks.length };
        }

        const artistMap = new Map();   // name → id
        const albumMap = new Map();    // "artistId|albumName" → id

        let syncedSongs = 0;

        // ── Detect compilation albums in memory by grouping by physical album folder ──
        const folderArtistsMap = new Map();
        for (const track of tracks) {
            const albumName = track.album;
            if (albumName && albumName !== 'Unknown Album' && albumName !== 'Single' && albumName !== 'Singles') {
                const folderPath = path.dirname(track.file_path);
                if (!folderArtistsMap.has(folderPath)) {
                    folderArtistsMap.set(folderPath, new Set());
                }
                if (track.artist) {
                    folderArtistsMap.get(folderPath).add(track.artist);
                }
            }
        }

        for (const track of tracks) {
            const albumName = track.album;
            if (albumName && albumName !== 'Unknown Album' && albumName !== 'Single' && albumName !== 'Singles') {
                const folderPath = path.dirname(track.file_path);
                const artists = folderArtistsMap.get(folderPath);
                if (artists && artists.size > 1) {
                    track.album_artist = 'Various Artists';
                }
            }
        }

        // ── Step 1: Upsert Artists ──
        const uniqueArtists = [...new Set([
            ...tracks.map(t => t.artist),
            ...tracks.map(t => t.album_artist)
        ].filter(Boolean))];
        
        for (const name of uniqueArtists) {
            try {
                const { data, error } = await this._supabase
                    .from('music_artists')
                    .upsert(
                        { name, is_synced: true, business_id: null }, 
                        { onConflict: 'name,business_id', ignoreDuplicates: false }
                    )
                    .select('id, name')
                    .single();

                if (error) throw error;
                artistMap.set(name, data.id);
            } catch (err) {
                console.warn(`[DriveWatcher] Artist upsert failed (${name}):`, err.message);
            }
        }

        // ── Step 2: Upsert Albums ──
        const uniqueAlbums = new Map(); // "artistName|albumName" → track
        for (const track of tracks) {
            const artistName = track.album_artist || track.artist || 'Unknown Artist';
            const key = `${artistName}|${track.album}`;
            if (!uniqueAlbums.has(key)) uniqueAlbums.set(key, track);
        }

        for (const [key, track] of uniqueAlbums) {
            const artistName = track.album_artist || track.artist || 'Unknown Artist';
            const artistId = artistMap.get(artistName);
            if (!artistId) continue;

            try {
                const { data, error } = await this._supabase
                    .from('music_albums')
                    .upsert({
                        name: track.album,
                        artist_id: artistId,
                        release_year: track.year || null,
                        is_synced: true,
                        business_id: null,
                        cover_url: track.cover_url || null,
                    }, { onConflict: 'name,artist_id,business_id', ignoreDuplicates: false })
                    .select('id')
                    .single();

                if (error) throw error;
                albumMap.set(key, data.id);
            } catch (err) {
                console.warn(`[DriveWatcher] Album upsert failed (${track.album}):`, err.message);
            }
        }

        // ── Step 3: Upsert Songs ──
        const BATCH_SIZE = 50;
        for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
            const batch = tracks.slice(i, i + BATCH_SIZE);

            const rows = batch.map(track => {
                let trackNum = parseInt(track.track_number, 10);
                if (isNaN(trackNum)) trackNum = 0;

                const albumArtistName = track.album_artist || track.artist || 'Unknown Artist';

                return {
                    title: track.title,
                    file_path: track.file_path,
                    file_size: track.file_size || null,
                    duration_seconds: Math.round(track.duration || 0),
                    genre: track.genre || null,
                    year: track.year || null,
                    artist_id: artistMap.get(track.artist) || null,
                    album_id: albumMap.get(`${albumArtistName}|${track.album}`) || null,
                    artist_name: track.artist || 'Unknown Artist',
                    album_name: track.album || 'Unknown Album',
                    album_artist: albumArtistName,
                    track_number: trackNum,
                    is_synced: true,
                    is_available: true,
                    scanned_at: track.scanned_at || new Date().toISOString(),
                    business_id: null,
                    thumbnail_url: track.cover_url || null,
                };
            });

            try {
                const { error } = await this._supabase
                    .from('music_songs')
                    .upsert(rows, { onConflict: 'file_path,business_id', ignoreDuplicates: false });

                if (error) throw error;
                syncedSongs += batch.length;
            } catch (err) {
                console.warn(`[DriveWatcher] Songs batch upsert failed (batch ${i}):`, err.message);
            }
        }

        return {
            artists: artistMap.size,
            albums: albumMap.size,
            songs: syncedSongs,
        };
    }
}

export default DriveWatcher;
