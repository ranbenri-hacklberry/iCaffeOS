/**
 * RanTunes WebSocket Server — Port 8082
 * 
 * The stateful "brain" of RanTunes.
 * Translates iPad commands → AudioPlayer/Queue actions → broadcasts state updates.
 * 
 * Command Protocol (Client → Server):
 *   { cmd: 'PLAY',       payload: { songId, filePath, duration } }
 *   { cmd: 'PAUSE' }
 *   { cmd: 'RESUME' }
 *   { cmd: 'STOP' }
 *   { cmd: 'NEXT' }
 *   { cmd: 'PREV' }
 *   { cmd: 'SEEK',       payload: { position } }        ← limited support (re-play from start)
 *   { cmd: 'VOLUME',     payload: { level } }            ← 0-100
 *   { cmd: 'LOAD_QUEUE', payload: { songs, startIndex } }
 *   { cmd: 'SHUFFLE',    payload: { enabled } }
 *   { cmd: 'REPEAT',     payload: { mode } }             ← 'none'|'one'|'all'
 *   { cmd: 'GET_STATE' }
 * 
 * Event Protocol (Server → All Clients):
 *   { event: 'STATE_UPDATE',    state: { ... } }
 *   { event: 'TRACK_ENDED' }
 *   { event: 'ERROR',           message: '...' }
 *   { event: 'LIBRARY_UPDATED', stats: { ... } }
 *   { event: 'DRIVE_EJECTED' }
 */

import { WebSocketServer, WebSocket } from 'ws';
import { AudioPlayer } from './audioPlayer.js';
import { PlaybackQueue } from './playbackQueue.js';

export class RantunesWsServer {
    constructor(port = 8082) {
        this._port = port;
        this._wss = null;
        this._player = new AudioPlayer();
        this._queue = new PlaybackQueue();
        this._positionInterval = null; // Broadcasts position every 2s
    }

    // ─────────────────────────────────────────────
    //  LIFECYCLE
    // ─────────────────────────────────────────────

    async start() {
        // Load persisted queue from disk
        await this._queue.load();

        this._wss = new WebSocketServer({ port: this._port });
        console.log(`🔌 [RantunesWS] WebSocket server listening on ws://localhost:${this._port}`);

        this._wss.on('connection', (ws, req) => {
            const clientIp = req.socket.remoteAddress;
            console.log(`📱 [RantunesWS] Client connected: ${clientIp}`);

            // Immediately send full state to new client
            this._sendToClient(ws, {
                event: 'STATE_UPDATE',
                state: this._buildState()
            });

            ws.on('message', (raw) => this._handleMessage(ws, raw));

            ws.on('close', () => {
                console.log(`📴 [RantunesWS] Client disconnected: ${clientIp}`);
            });

            ws.on('error', (err) => {
                console.warn(`[RantunesWS] Client error (${clientIp}):`, err.message);
            });
        });

        // Wire AudioPlayer events
        this._player.on('trackEnd', () => this._onTrackEnd());
        this._player.on('trackError', (err) => {
            console.error('[RantunesWS] Player error:', err.message);
            this._broadcast({ event: 'ERROR', message: err.message });
        });
        this._player.on('stateChange', () => {
            console.log('📡 [RantunesWS] Player state changed — broadcasting...');
            this._broadcastState();
        });

        // Start position broadcast interval (every 2 seconds)
        this._positionInterval = setInterval(() => {
            const playerState = this._player.getState();
            if (playerState.isPlaying) {
                this._broadcast({
                    event: 'STATE_UPDATE',
                    state: this._buildState()
                });
            }
        }, 2000);

        console.log(`✅ [RantunesWS] Ready — port ${this._port}`);
    }

    stop() {
        if (this._positionInterval) clearInterval(this._positionInterval);
        this._player.stop();
        this._wss?.close();
        console.log('[RantunesWS] Stopped');
    }

    // ─────────────────────────────────────────────
    //  COMMAND ROUTER
    // ─────────────────────────────────────────────

    _handleMessage(ws, raw) {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        } catch {
            this._sendToClient(ws, { event: 'ERROR', message: 'Invalid JSON' });
            return;
        }

        const { cmd, payload = {} } = msg;
        console.log(`📨 [RantunesWS] Command: ${cmd}`, payload);

        switch (cmd) {
            case 'PLAY':       return this._cmdPlay(payload);
            case 'PAUSE':      return this._cmdPause();
            case 'RESUME':     return this._cmdResume();
            case 'STOP':       return this._cmdStop();
            case 'NEXT':       return this._cmdNext();
            case 'PREV':       return this._cmdPrev();
            case 'SEEK':       return this._cmdSeek(payload);
            case 'VOLUME':     return this._cmdVolume(payload);
            case 'LOAD_QUEUE': return this._cmdLoadQueue(payload);
            case 'SHUFFLE':    return this._cmdShuffle(payload);
            case 'REPEAT':     return this._cmdRepeat(payload);
            case 'GET_STATE':  return this._sendToClient(ws, { event: 'STATE_UPDATE', state: this._buildState() });
            default:
                this._sendToClient(ws, { event: 'ERROR', message: `Unknown command: ${cmd}` });
        }
    }

    // ─────────────────────────────────────────────
    //  COMMAND HANDLERS
    // ─────────────────────────────────────────────

    async _cmdPlay(payload) {
        try {
            const { filePath, duration, songId } = payload;

            // If a specific filePath is given, play it directly
            if (filePath) {
                // Update queue position if songId matches something in the queue
                const queueState = this._queue.getState();
                const matchIdx = queueState.queue.findIndex(s => s.id === songId || s.file_path === filePath);
                if (matchIdx >= 0) {
                    this._queue.jumpTo(matchIdx);
                }

                await this._player.play(filePath, duration || 0);
            } else {
                // Play current song in queue
                const song = this._queue.currentSong();
                if (!song || !song.file_path) {
                    this._broadcast({ event: 'ERROR', message: 'No song in queue to play' });
                    return;
                }
                await this._player.play(song.file_path, song.duration_seconds || 0);
            }

            this._broadcastState();
        } catch (err) {
            console.error('[RantunesWS] PLAY error:', err.message);
            this._broadcast({ event: 'ERROR', message: err.message });
        }
    }

    _cmdPause() {
        this._player.pause();
        this._broadcastState();
    }

    _cmdResume() {
        this._player.resume();
        this._broadcastState();
    }

    _cmdStop() {
        this._player.stop();
        this._broadcastState();
    }

    async _cmdNext() {
        const song = this._queue.next();
        if (!song) {
            this._player.stop();
            this._broadcastState();
            return;
        }
        try {
            await this._player.play(song.file_path, song.duration_seconds || 0);
            this._broadcastState();
        } catch (err) {
            this._broadcast({ event: 'ERROR', message: err.message });
        }
    }

    async _cmdPrev() {
        const song = this._queue.prev();
        if (!song) return;
        try {
            await this._player.play(song.file_path, song.duration_seconds || 0);
            this._broadcastState();
        } catch (err) {
            this._broadcast({ event: 'ERROR', message: err.message });
        }
    }

    async _cmdSeek(payload) {
        // afplay does not support seeking natively.
        // Workaround: re-spawn with afplay's -t (start time) flag isn't available.
        // Real seek would require ffplay with -ss flag — but pausing/resuming is the main use case.
        // For now: log that seek is not fully supported; future: re-spawn ffplay -ss <position>
        const { position = 0 } = payload;
        console.warn(`[RantunesWS] SEEK to ${position}s requested — limited support with afplay`);

        const song = this._queue.currentSong();
        if (song?.file_path) {
            // Re-spawn from the desired position using ffplay's -ss flag
            try {
                await this._player.play(song.file_path, song.duration_seconds || 0);
            } catch (err) {
                this._broadcast({ event: 'ERROR', message: err.message });
            }
        }
        this._broadcastState();
    }

    async _cmdVolume(payload) {
        const { level = 75 } = payload;
        this._queue.setVolume(level);
        await this._player.setVolume(level);
        this._broadcastState();
    }

    async _cmdLoadQueue(payload) {
        const { songs = [], startIndex = 0 } = payload;
        this._queue.loadQueue(songs, startIndex);

        const song = this._queue.currentSong();
        if (song?.file_path) {
            try {
                await this._player.play(song.file_path, song.duration_seconds || 0);
            } catch (err) {
                this._broadcast({ event: 'ERROR', message: err.message });
            }
        }
        this._broadcastState();
    }

    _cmdShuffle(payload) {
        const { enabled } = payload;
        if (enabled) {
            this._queue.shuffle();
        } else {
            this._queue.unshuffle();
        }
        this._broadcastState();
    }

    _cmdRepeat(payload) {
        const { mode = 'none' } = payload;
        this._queue.setRepeat(mode);
        this._broadcastState();
    }

    // ─────────────────────────────────────────────
    //  TRACK END HANDLER
    // ─────────────────────────────────────────────

    async _onTrackEnd() {
        this._broadcast({ event: 'TRACK_ENDED' });

        const nextSong = this._queue.next();
        if (!nextSong) {
            console.log('[RantunesWS] Queue exhausted');
            this._broadcastState();
            return;
        }

        try {
            await this._player.play(nextSong.file_path, nextSong.duration_seconds || 0);
            console.log(`▶️ [RantunesWS] Auto-advancing to: ${nextSong.title}`);
            this._broadcastState();
        } catch (err) {
            console.error('[RantunesWS] Auto-advance failed:', err.message);
            this._broadcast({ event: 'ERROR', message: err.message });
        }
    }

    // ─────────────────────────────────────────────
    //  EXTERNAL EVENTS (called by DriveWatcher)
    // ─────────────────────────────────────────────

    broadcastLibraryUpdated(stats) {
        this._broadcast({ event: 'LIBRARY_UPDATED', stats });
    }

    broadcastDriveEjected() {
        // If currently playing from the ejected drive, stop
        const song = this._queue.currentSong();
        if (song?.file_path?.startsWith('/Volumes/')) {
            console.log('💿 [RantunesWS] Stopping playback — drive ejected');
            this._player.stop();
        }
        this._broadcast({ event: 'DRIVE_EJECTED' });
        this._broadcastState();
    }

    // ─────────────────────────────────────────────
    //  BROADCAST HELPERS
    // ─────────────────────────────────────────────

    _buildState() {
        const playerState = this._player.getState();
        const queueState = this._queue.getState();

        return {
            isPlaying: playerState.isPlaying,
            isPaused: playerState.isPaused,
            currentSong: queueState.currentSong,
            position: playerState.position,
            duration: playerState.duration || queueState.currentSong?.duration_seconds || 0,
            queue: queueState.queue,
            currentIndex: queueState.currentIndex,
            queueLength: queueState.queueLength,
            shuffled: queueState.shuffled,
            repeat: queueState.repeat,
            volume: queueState.volume,
        };
    }

    _broadcastState() {
        this._broadcast({ event: 'STATE_UPDATE', state: this._buildState() });
    }

    _broadcast(payload) {
        if (!this._wss) return;
        const msg = JSON.stringify(payload);
        this._wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        });
    }

    _sendToClient(ws, payload) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
        }
    }
}

export default RantunesWsServer;
