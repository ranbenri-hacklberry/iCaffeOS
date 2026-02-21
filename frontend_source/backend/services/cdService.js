import { exec } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { PathManager } from '../utils/pathManager.js';

export const CDService = {
    /**
     * Detects if an audio CD is mounted.
     * On macOS, it checks /Volumes for typical Audio CD mounts or uses drutil.
     */
    async detectCD() {
        return new Promise((resolve) => {
            const isMac = process.platform === 'darwin';
            if (isMac) {
                // Check if any Audio CD is listed in /Volumes
                if (fs.existsSync('/Volumes/Audio CD')) {
                    return resolve({ mounted: true, path: '/Volumes/Audio CD' });
                }

                // Fallback to drutil
                exec('drutil status', (err, stdout) => {
                    if (!err && stdout.includes('Bit:')) {
                        resolve({ mounted: true, info: 'Detected via drutil' });
                    } else {
                        resolve({ mounted: false });
                    }
                });
            } else {
                // Linux: check /dev/sr0
                exec('lsblk -o NAME,TYPE,MOUNTPOINT | grep rom', (err, stdout) => {
                    if (!err && stdout.includes('rom')) {
                        resolve({ mounted: true, raw_device: '/dev/sr0' });
                    } else {
                        resolve({ mounted: false });
                    }
                });
            }
        });
    },

    /**
     * Generates a unique Token for the album based on the CD's TOC
     */
    async generateAlbumToken() {
        return new Promise((resolve, reject) => {
            // For logic demonstration, we'll try to get TOC info. 
            // In a real env, we'd parse `drutil toc` or `cd-discid`.
            const cmd = process.platform === 'darwin' ? 'drutil toc' : 'cd-discid /dev/sr0';

            exec(cmd, (err, stdout) => {
                if (err) {
                    // Fallback to a random session token if hardware read fails (for simulation)
                    const randomToken = crypto.randomBytes(32).toString('hex');
                    return resolve(randomToken);
                }

                const hash = crypto.createHash('sha256');
                hash.update(stdout);
                resolve(hash.digest('hex'));
            });
        });
    },

    /**
     * Resolves metadata using MusicBrainz
     */
    async resolveMetadata(discId) {
        if (!discId) return null;
        try {
            const url = `https://musicbrainz.org/ws/2/discid/${discId}?inc=recordings&fmt=json`;
            const res = await fetch(url, { headers: { 'User-Agent': 'rantunes/1.0 ( mail@example.com )' } });
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            console.error('❌ MusicBrainz error:', err);
            return null;
        }
    },

    /**
     * Rips a track from physical CD
     * Profile: 'lossless' (FLAC) or 'mobile' (AAC)
     */
    async ripTrack(trackNumber, drivePath, outputPath, profile = 'lossless') {
        return new Promise((resolve, reject) => {
            // ffmpeg -f libcdio -ss <track_offset> -to <track_end> ...
            // Or if mounted as files (macOS):
            const isMac = process.platform === 'darwin';
            const mountedPath = `/Volumes/Audio CD/Track ${trackNumber}.aiff`;

            let cmd;
            if (isMac && fs.existsSync(mountedPath)) {
                // Faster to just convert from the mount
                if (profile === 'lossless') {
                    cmd = `ffmpeg -i "${mountedPath}" -c:a flac -y "${outputPath}"`;
                } else {
                    cmd = `ffmpeg -i "${mountedPath}" -c:a aac -b:a 256k -y "${outputPath}"`;
                }
            } else {
                // Hardware level access (Linux or unmounted Mac)
                const device = isMac ? 'cdda://' : '/dev/sr0';
                // Note: ripping specific tracks via device requires knowing offsets.
                // Simplified for the demo:
                cmd = `ffmpeg -f libcdio -i "${device}" -track ${trackNumber} -c:a ${profile === 'lossless' ? 'flac' : 'aac'} "${outputPath}"`;
            }

            console.log(`📀 Ripping Track ${trackNumber}: ${cmd}`);
            exec(cmd, (err) => {
                if (err) reject(err);
                else resolve(outputPath);
            });
        });
    }
};

export default CDService;
