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

const SUPPORTED_EXTS = new Set(['.mp3', '.flac', '.m4a', '.wav', '.ogg', '.aac']);

export class LocalAssetScanner {
    constructor(rootPath) {
        this.rootPath = rootPath;
    }

    /**
     * Scan the directory recursively and return metadata for all valid audio files.
     * @returns {Promise<Array>} Array of asset objects
     */
    async scan() {
        if (!this.rootPath) {
            console.error("❌ No root path provided to scanner.");
            return [];
        }

        console.log(`📂 Scanning music directory: ${this.rootPath}`);

        try {
            await fsPromises.access(this.rootPath);
        } catch (error) {
            console.error(`❌ Path not accessible: ${this.rootPath} - ${error.message}`);
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

            // Logic: 
            // 1. Tags
            // 2. Folder depth (Album = parent, Artist = grandparent)
            // 3. Defaults

            const albumFallback = this._getFolderFallback(filePath, 1);
            const artistFallback = this._getFolderFallback(filePath, 2);

            return {
                id: this._generateId(filePath),
                file_path: filePath,
                file_size: stats.size,
                title: common.title || path.basename(filePath, path.extname(filePath)),
                artist: common.artist || artistFallback || 'Unknown Artist',
                album: common.album || albumFallback || 'Unknown Album',
                genre: common.genre ? common.genre[0] : null,
                year: common.year || null,
                duration: format.duration || 0,
                scanned_at: new Date().toISOString()
            };
        } catch (error) {
            const stats = await fsPromises.stat(filePath).catch(() => ({ size: 0 }));
            const albumFallback = this._getFolderFallback(filePath, 1);
            const artistFallback = this._getFolderFallback(filePath, 2);

            return {
                id: this._generateId(filePath),
                file_path: filePath,
                file_size: stats.size,
                title: path.basename(filePath),
                artist: artistFallback || 'Unknown',
                album: albumFallback || 'Unknown',
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

        // Safety: If we've reached the root or generic system folders, stop.
        if (!name || name === '.' || name === '..' || name === 'Volumes' || name === 'mnt' || name === 'Users' || current === this.rootPath) {
            return null;
        }

        return name;
    }

    _generateId(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return `local_${Math.abs(hash)}`;
    }
}
