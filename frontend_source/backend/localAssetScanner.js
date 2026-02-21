/**
 * Local Asset Scanner
 * Recursively scans a directory for music files and extracts metadata.
 * Designed to feed data to the frontend Dexie DB.
 */
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import os from 'os';
import { parseFile } from 'music-metadata';

const getInitialMusicPath = () => {
    if (process.env.RANTUNES_MUSIC_PATH) return process.env.RANTUNES_MUSIC_PATH;
    const externalPath = process.platform === 'darwin' ? '/Volumes/RANTUNES' : '/mnt/music_ssd';
    const localPath = path.join(os.homedir(), 'Music', 'iCaffe');

    if (fs.existsSync(externalPath)) return externalPath;
    return localPath;
};

const DEFAULT_MUSIC_PATH = getInitialMusicPath();
const SUPPORTED_EXTS = new Set(['.mp3', '.flac', '.m4a', '.wav', '.ogg', '.aac']);

export class LocalAssetScanner {
    constructor(rootPath = DEFAULT_MUSIC_PATH) {
        this.rootPath = rootPath;
    }

    /**
     * Scan the directory recursively and return metadata for all valid audio files.
     * @returns {Promise<Array>} Array of asset objects
     */
    async scan() {
        console.log(`📂 Scanning music directory: ${this.rootPath}`);

        try {
            await fsPromises.access(this.rootPath);
        } catch (error) {
            console.error(`❌ Path not accessible: ${this.rootPath}`);
            return [];
        }

        const assets = [];
        await this._scanDir(this.rootPath, assets);

        console.log(`✅ Scan complete. Found ${assets.length} tracks.`);
        return assets;
    }

    async _scanDir(dir, assets) {
        let entries;
        try {
            entries = await fsPromises.readdir(dir, { withFileTypes: true });
        } catch (err) {
            console.warn(`⚠️ Cannot read directory: ${dir}`, err.message);
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Recursive step
                // Ignore hidden dirs like .TRASH or .Spotlight-V100
                if (!entry.name.startsWith('.')) {
                    await this._scanDir(fullPath, assets);
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (SUPPORTED_EXTS.has(ext)) {
                    try {
                        const metadata = await this._extractMetadata(fullPath);
                        if (metadata) {
                            assets.push(metadata);
                        }
                    } catch (err) {
                        console.warn(`⚠️ Failed to parse: ${entry.name}`, err.message);
                    }
                }
            }
        }
    }

    async _extractMetadata(filePath) {
        try {
            // music-metadata extraction
            const metadata = await parseFile(filePath, { skipCovers: true, duration: true });
            const { common, format } = metadata;
            const stats = await fsPromises.stat(filePath);

            return {
                id: this._generateId(filePath), // generate stable ID
                file_path: filePath,
                file_size: stats.size,
                title: common.title || path.basename(filePath, path.extname(filePath)),
                artist: common.artist || this._getFolderFallback(filePath, 2) || 'Unknown Artist',
                album: common.album || this._getFolderFallback(filePath, 1) || 'Unknown Album',
                genre: common.genre ? common.genre[0] : null,
                year: common.year || null,
                duration: format.duration || 0,
                scanned_at: new Date().toISOString()
            };
        } catch (error) {
            // Fallback for minimal info if metadata extraction fails but file is valid
            const stats = await fsPromises.stat(filePath).catch(() => ({ size: 0 }));
            return {
                id: this._generateId(filePath),
                file_path: filePath,
                file_size: stats.size,
                title: path.basename(filePath),
                artist: 'Unknown',
                album: 'Unknown',
                duration: 0,
                scanned_at: new Date().toISOString()
            };
        }
    }

    _getFolderFallback(filePath, depth) {
        let current = filePath;
        for (let i = 0; i < depth; i++) {
            current = path.dirname(current);
        }
        const name = path.basename(current);
        const parent = path.dirname(current);

        // Don't use root path name or generic volume names
        if (current === this.rootPath || parent === '/' || name === 'Volumes' || name === 'mnt' || name === 'Users') {
            return null;
        }
        return name;
    }

    _generateId(str) {
        // Simple hash for ID consistency
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return `local_${Math.abs(hash)}`; // e.g. local_123456789
    }
}
