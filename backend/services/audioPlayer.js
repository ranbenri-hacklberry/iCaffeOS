/**
 * RanTunes AudioPlayer Service
 * Manages a single afplay/ffplay subprocess for local hardware audio output on macOS.
 * 
 * Architecture:
 *  - afplay: native macOS, zero dependencies, supports MP3/AAC/M4A/WAV/FLAC(12+)
 *  - ffplay: fallback for exotic formats (requires ffmpeg installed)
 *  - SIGSTOP / SIGCONT for pause/resume (no re-seek needed)
 *  - osascript for system volume control
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Formats that afplay handles natively on macOS 12+
const AFPLAY_SUPPORTED = new Set(['.mp3', '.m4a', '.aac', '.wav', '.aiff', '.caf', '.flac']);

// Formats that need ffplay fallback
const FFPLAY_FORMATS = new Set(['.ogg', '.opus', '.wma', '.ape', '.mpc']);

export class AudioPlayer extends EventEmitter {
    constructor() {
        super();
        this._process = null;
        this._filePath = null;
        this._startTime = null;       // Date.now() when playback started
        this._pausedAt = null;        // elapsed ms when paused
        this._isPaused = false;
        this._isStopped = true;
        this._currentVolume = 75;    // 0-100
        this._duration = 0;          // seconds, set externally by PlaybackQueue
    }

    // ─────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────

    /**
     * Play a file on the local hardware audio output.
     * Kills any running subprocess first.
     * @param {string} filePath   Absolute path to audio file
     * @param {number} duration   Duration in seconds (for position tracking)
     */
    async play(filePath, duration = 0) {
        if (!filePath) throw new Error('AudioPlayer: No file path provided');
        if (!fs.existsSync(filePath)) throw new Error(`AudioPlayer: File not found: ${filePath}`);

        // Stop any existing playback cleanly
        this._kill();

        this._filePath = filePath;
        this._duration = duration;
        this._startTime = Date.now();
        this._pausedAt = null;
        this._isPaused = false;
        this._isStopped = false;

        const ext = path.extname(filePath).toLowerCase();

        console.log(`🎵 [AudioPlayer] Attempting playback of: ${path.basename(filePath)} (${ext})`);

        // If it's a high-res or exotic format, we prefer ffplay if installed.
        // On M4, afplay is great for standard stuff, but ffplay handles FLAC metadata better.
        const useFfplay = FFPLAY_FORMATS.has(ext) || ext === '.flac';

        if (useFfplay) {
            this._spawnFfplay(filePath);
        } else {
            this._spawnAfplay(filePath);
        }

        // Emit a state change immediately so the WS server can notify clients
        this.emit('stateChange');
    }

    /**
     * Pause — sends SIGSTOP to freeze the process in-place.
     * Native macOS trick: zero CPU, zero memory churn, resumes from exact position.
     */
    pause() {
        if (!this._process || this._isPaused || this._isStopped) return;
        try {
            process.kill(this._process.pid, 'SIGSTOP');
            this._pausedAt = Date.now() - this._startTime; // record elapsed ms
            this._isPaused = true;
            console.log('⏸  [AudioPlayer] Paused (SIGSTOP)');
        } catch (e) {
            console.error('[AudioPlayer] Pause failed:', e.message);
        }
    }

    /**
     * Resume — sends SIGCONT to unfreeze the process.
     */
    resume() {
        if (!this._process || !this._isPaused) return;
        try {
            process.kill(this._process.pid, 'SIGCONT');
            // Adjust startTime so elapsed keeps counting from the paused point
            this._startTime = Date.now() - this._pausedAt;
            this._pausedAt = null;
            this._isPaused = false;
            console.log('▶️  [AudioPlayer] Resumed (SIGCONT)');
        } catch (e) {
            console.error('[AudioPlayer] Resume failed:', e.message);
        }
    }

    /**
     * Stop — kills subprocess immediately.
     */
    stop() {
        console.log('⏹  [AudioPlayer] Stop requested');
        this._kill();
    }

    /**
     * Set system output volume via osascript (affects the Mac's master output).
     * @param {number} level   0-100
     */
    async setVolume(level) {
        const clamped = Math.max(0, Math.min(100, Math.round(level)));
        this._currentVolume = clamped;

        return new Promise((resolve) => {
            const script = spawn('osascript', ['-e', `set volume output volume ${clamped}`]);
            script.on('close', (code) => {
                if (code === 0) {
                    console.log(`🔊 [AudioPlayer] Volume set to ${clamped}`);
                } else {
                    console.warn('[AudioPlayer] osascript volume failed, code:', code);
                }
                resolve();
            });
        });
    }

    /**
     * Get a snapshot of the current playback state.
     */
    getState() {
        return {
            isPlaying: !this._isStopped && !this._isPaused,
            isPaused: this._isPaused,
            isStopped: this._isStopped,
            filePath: this._filePath,
            position: this._getPositionSeconds(),
            duration: this._duration,
            volume: this._currentVolume,
        };
    }

    // ─────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────

    _spawnAfplay(filePath) {
        // -q ignores QuickTime warnings; we use an array to avoid shell interpretation
        this._process = spawn('afplay', [filePath], { shell: false, windowsHide: true });
        this._attachProcessHandlers(this._process, 'afplay');
    }

    _spawnFfplay(filePath) {
        this._process = spawn('ffplay', [
            '-nodisp',
            '-autoexit',
            '-loglevel', 'error',
            filePath
        ], { shell: false, windowsHide: true });
        this._attachProcessHandlers(this._process, 'ffplay');
    }

    _attachProcessHandlers(proc, playerName) {
        proc.on('close', (code, signal) => {
            // SIGSTOP/SIGCONT don't close the process — only real exits do
            if (signal === 'SIGKILL' || signal === 'SIGTERM') {
                // We killed it intentionally — do not emit trackEnd
                console.log(`[AudioPlayer] Process killed (${signal})`);
                this._isStopped = true;
                return;
            }
            if (code === 0) {
                // Natural end of track
                console.log(`🎵 [AudioPlayer] (${playerName}) Track ended naturally`);
                this._isStopped = true;
                this._filePath = null;
                this.emit('trackEnd');
            } else {
                console.error(`❌ [AudioPlayer] (${playerName}) exited with code ${code}`);
                this._isStopped = true;
                this.emit('trackError', new Error(`${playerName} exited with code ${code}`));
            }
        });

        proc.stderr?.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg) console.warn('[AudioPlayer] stderr:', msg);
        });
    }

    _kill() {
        if (this._process) {
            try {
                // If paused (SIGSTOP), we must SIGCONT before SIGKILL or it won't die
                if (this._isPaused) {
                    process.kill(this._process.pid, 'SIGCONT');
                }
                this._process.kill('SIGKILL');
            } catch (e) {
                // Process may already be dead
            }
            this._process = null;
        }
        this._isStopped = true;
        this._isPaused = false;
        this._filePath = null;
        this._startTime = null;
        this._pausedAt = null;
    }

    /**
     * Calculate elapsed playback position in seconds.
     * Accounts for paused time.
     */
    _getPositionSeconds() {
        if (this._isStopped || !this._startTime) return 0;
        if (this._isPaused) return Math.round(this._pausedAt / 1000);
        return Math.round((Date.now() - this._startTime) / 1000);
    }
}

export default AudioPlayer;
