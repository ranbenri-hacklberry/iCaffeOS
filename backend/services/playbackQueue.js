/**
 * RanTunes PlaybackQueue Service
 * Manages queue state, shuffle, repeat, and persistence across server restarts.
 * 
 * State is decoupled from AudioPlayer — this class knows WHAT to play, not HOW.
 * The WS server is the glue layer that calls into both.
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import os from 'os';

const QUEUE_DIR = path.join(os.homedir(), '.icaffeos');
const QUEUE_FILE = path.join(QUEUE_DIR, 'rantunes_queue.json');

const DEFAULT_STATE = {
    queue: [],          // [{ id, title, artist, file_path, duration_seconds, album, cover_url }]
    currentIndex: 0,
    shuffled: false,
    shuffleOrder: [],   // Shuffled index permutation (indices into queue[])
    repeat: 'none',    // 'none' | 'one' | 'all'
    volume: 75
};

export class PlaybackQueue {
    constructor() {
        this._state = { ...DEFAULT_STATE };
        this._originalOrder = []; // Pre-shuffle order snapshot
        this._loaded = false;
    }

    // ─────────────────────────────────────────────
    //  INIT
    // ─────────────────────────────────────────────

    /**
     * Load persisted state from disk. Call once on startup.
     */
    async load() {
        try {
            await fsPromises.mkdir(QUEUE_DIR, { recursive: true });
            const raw = await fsPromises.readFile(QUEUE_FILE, 'utf-8');
            const saved = JSON.parse(raw);
            // Merge saved into defaults to handle schema evolution
            this._state = { ...DEFAULT_STATE, ...saved };
            console.log(`📂 [PlaybackQueue] Loaded ${this._state.queue.length} tracks from disk`);
        } catch (_) {
            // No file or bad JSON — start fresh
            console.log('[PlaybackQueue] No saved queue found, starting fresh');
        }
        this._loaded = true;
    }

    // ─────────────────────────────────────────────
    //  QUEUE MANAGEMENT
    // ─────────────────────────────────────────────

    /**
     * Replace entire queue and reset index.
     * @param {Array}  songs        Array of song objects
     * @param {number} startIndex   Which index to begin playback from
     */
    loadQueue(songs, startIndex = 0) {
        if (!Array.isArray(songs)) return;
        this._state.queue = songs.map(this._normalizeSong);
        this._state.currentIndex = Math.max(0, Math.min(startIndex, songs.length - 1));
        this._state.shuffled = false;
        this._state.shuffleOrder = [];
        this._originalOrder = [];
        this._save();
        console.log(`📋 [PlaybackQueue] Loaded ${songs.length} tracks, starting at #${startIndex}`);
    }

    /**
     * Append a single song to the queue.
     */
    addToQueue(song) {
        this._state.queue.push(this._normalizeSong(song));
        this._save();
    }

    /**
     * Remove a song at a given queue index.
     */
    removeFromQueue(index) {
        if (index < 0 || index >= this._state.queue.length) return;
        this._state.queue.splice(index, 1);
        // Adjust currentIndex if needed
        if (index < this._state.currentIndex) {
            this._state.currentIndex = Math.max(0, this._state.currentIndex - 1);
        }
        this._save();
    }

    // ─────────────────────────────────────────────
    //  NAVIGATION
    // ─────────────────────────────────────────────

    /**
     * Move to the next song.
     * @returns {object|null}  The next song, or null if queue is exhausted.
     */
    next() {
        if (this._state.queue.length === 0) return null;

        if (this._state.repeat === 'one') {
            return this.currentSong(); // Stay on same index
        }

        const nextIdx = this._advance(this._state.currentIndex, 1);
        if (nextIdx === null) return null;

        this._state.currentIndex = nextIdx;
        this._save();
        return this.currentSong();
    }

    /**
     * Move to the previous song.
     * @returns {object|null}
     */
    prev() {
        if (this._state.queue.length === 0) return null;

        const prevIdx = this._advance(this._state.currentIndex, -1);
        if (prevIdx === null) return null;

        this._state.currentIndex = prevIdx;
        this._save();
        return this.currentSong();
    }

    /**
     * Jump to a specific index in the queue.
     */
    jumpTo(index) {
        if (index < 0 || index >= this._state.queue.length) return null;
        this._state.currentIndex = index;
        this._save();
        return this.currentSong();
    }

    /**
     * Return the current song object.
     */
    currentSong() {
        const { queue, currentIndex, shuffled, shuffleOrder } = this._state;
        if (queue.length === 0) return null;

        // In shuffle mode, resolve the actual queue index from shuffleOrder
        const resolvedIndex = shuffled && shuffleOrder.length > 0
            ? shuffleOrder[currentIndex]
            : currentIndex;

        return queue[resolvedIndex] || null;
    }

    // ─────────────────────────────────────────────
    //  SHUFFLE & REPEAT
    // ─────────────────────────────────────────────

    shuffle() {
        if (this._state.queue.length === 0) return;

        // Save original order so we can unshuffle
        this._originalOrder = [...Array(this._state.queue.length).keys()];

        // Fisher-Yates shuffle on index array
        const order = [...this._originalOrder];
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }

        // Put current song first in shuffle order
        const currentResolved = this._state.queue[this._state.currentIndex];
        const currentPos = order.indexOf(this._state.currentIndex);
        if (currentPos > 0) {
            [order[0], order[currentPos]] = [order[currentPos], order[0]];
        }

        this._state.shuffleOrder = order;
        this._state.shuffled = true;
        this._state.currentIndex = 0; // Reset to position 0 of shuffle order
        this._save();
        console.log('🔀 [PlaybackQueue] Shuffle ON');
    }

    unshuffle() {
        if (!this._state.shuffled) return;

        // Restore original index of current song
        const currentSong = this.currentSong();
        if (currentSong) {
            const originalIdx = this._state.queue.findIndex(s => s.id === currentSong.id);
            this._state.currentIndex = originalIdx >= 0 ? originalIdx : 0;
        }

        this._state.shuffled = false;
        this._state.shuffleOrder = [];
        this._originalOrder = [];
        this._save();
        console.log('🔂 [PlaybackQueue] Shuffle OFF');
    }

    /**
     * @param {'none'|'one'|'all'} mode
     */
    setRepeat(mode) {
        if (!['none', 'one', 'all'].includes(mode)) return;
        this._state.repeat = mode;
        this._save();
        console.log(`🔁 [PlaybackQueue] Repeat set to: ${mode}`);
    }

    // ─────────────────────────────────────────────
    //  VOLUME
    // ─────────────────────────────────────────────

    setVolume(level) {
        this._state.volume = Math.max(0, Math.min(100, Math.round(level)));
        this._save();
    }

    // ─────────────────────────────────────────────
    //  STATE EXPORT
    // ─────────────────────────────────────────────

    /**
     * Return full state snapshot for broadcasting to clients.
     */
    getState() {
        return {
            queue: this._state.queue,
            currentIndex: this._state.currentIndex,
            currentSong: this.currentSong(),
            shuffled: this._state.shuffled,
            repeat: this._state.repeat,
            volume: this._state.volume,
            queueLength: this._state.queue.length,
        };
    }

    // ─────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────

    /**
     * Advance currentIndex by delta (+1 or -1), respecting repeat mode.
     * Returns new index or null if queue is exhausted.
     */
    _advance(currentIdx, delta) {
        const len = this._state.queue.length;
        if (len === 0) return null;

        let next = currentIdx + delta;

        if (next >= len) {
            if (this._state.repeat === 'all') return 0;
            return null; // Queue exhausted
        }

        if (next < 0) {
            if (this._state.repeat === 'all') return len - 1;
            return 0; // Clamp to start
        }

        return next;
    }

    /**
     * Normalize song object to consistent shape.
     */
    _normalizeSong(song) {
        return {
            id: song.id || song.track_id || `song_${Date.now()}`,
            title: song.title || 'Unknown Title',
            artist: song.artist?.name || song.artist || 'Unknown Artist',
            album: song.album?.name || song.album || 'Unknown Album',
            cover_url: song.cover_url || song.album?.cover_url || song.thumbnail_url || null,
            file_path: song.file_path || null,
            duration_seconds: song.duration_seconds || song.duration || 0,
        };
    }

    /**
     * Persist state to disk (non-blocking, best effort).
     */
    _save() {
        fsPromises.mkdir(QUEUE_DIR, { recursive: true })
            .then(() => fsPromises.writeFile(QUEUE_FILE, JSON.stringify(this._state, null, 2), 'utf-8'))
            .catch(err => console.warn('[PlaybackQueue] Failed to save state:', err.message));
    }
}

export default PlaybackQueue;
