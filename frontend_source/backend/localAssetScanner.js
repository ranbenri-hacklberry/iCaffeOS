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
    // 1. Prioritize Environment Variables
    if (process.env.MUSIC_DIRECTORY) return process.env.MUSIC_DIRECTORY;
    if (process.env.RANTUNES_MUSIC_PATH) return process.env.RANTUNES_MUSIC_PATH;

    // 2. Platform-Specific Defaults
    const localPath = path.join(os.homedir(), 'Music', 'iCaffe');
    const candidates = process.platform === 'darwin'
        ? ['/Volumes/RANTUNES', '/Volumes/Ran1', '/Volumes/RanTunes']
        : ['/mnt/music_ssd', '/mnt/rantunes', '/Volumes/RANTUNES'];

    for (const cand of candidates) {
        if (fs.existsSync(cand)) return cand;
    }

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
                // Skip macOS resource fork files
                if (entry.name.startsWith('._')) continue;
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

    /**
     * Clean common release/torrent tags from folder names.
     * "Bob Marley & The Wailers - Gold (2005) [FLAC] 88" → "Bob Marley & The Wailers - Gold"
     */
    _cleanFolderName(name) {
        if (!name) return name;
        return name
            .replace(/\s*[\[\(\{].*?[\]\)\}]\s*/g, ' ')  // Remove [FLAC], (2005), {PMEDIA}
            .replace(/\s*⭐️?\s*/g, '')                     // Remove emoji markers
            .replace(/\s+\d{2,4}$/g, '')                    // Remove trailing numbers like "88"
            .replace(/\s+/g, ' ')                           // Normalize whitespace
            .trim();
    }

    async _extractMetadata(filePath) {
        try {
            const metadata = await parseFile(filePath, { skipCovers: true, duration: true });
            const { common, format } = metadata;
            const stats = await fsPromises.stat(filePath);

            let rawArtist = common.artist;
            let rawAlbum = common.album;
            let rawAlbumArtist = common.albumartist;

            const folderName1 = this._getFolderFallback(filePath, 1);  // Direct parent (e.g. "CD 1")
            const folderName2 = this._getFolderFallback(filePath, 2);  // Grandparent (e.g. album folder)

            // 1. Album Fallback
            if (!rawAlbum) {
                rawAlbum = folderName1;
            }

            // 2. Handle CD/Disc subfolders — whether from metadata or folder fallback
            if (rawAlbum && /^(CD|Disc|Disk|Part)\s*\d+/i.test(rawAlbum)) {
                if (folderName2) rawAlbum = folderName2;
            }

            // 3. Artist Fallback
            if (!rawArtist) {
                rawArtist = folderName2 || folderName1 || 'Unknown Artist';
            }

            // 4. Clean folder-derived names from release tags
            if (rawArtist === folderName2 || rawArtist === folderName1) {
                rawArtist = this._cleanFolderName(rawArtist);
            }
            if (rawAlbum === folderName2 || rawAlbum === folderName1) {
                rawAlbum = this._cleanFolderName(rawAlbum);
            }

            // 5. Split "Artist - Album" pattern in folder-derived names
            if (!common.artist && rawAlbum && rawAlbum.includes(' - ')) {
                const [p1, ...p2] = rawAlbum.split(' - ');
                if (!common.artist) rawArtist = p1.trim();
                rawAlbum = p2.join(' - ').trim();
            } else if (rawArtist && rawArtist.includes(' - ') && rawArtist === this._cleanFolderName(folderName2)) {
                // Artist from grandparent folder in "Artist - Album" format
                const [p1, ...p2] = rawArtist.split(' - ');
                rawArtist = p1.trim();
                if (!common.album && p2.length > 0) {
                    rawAlbum = p2.join(' - ').trim();
                }
            }

            return {
                id: this._generateId(filePath),
                file_path: filePath,
                file_size: stats.size,
                title: common.title || path.basename(filePath, path.extname(filePath)),
                artist: rawArtist || 'Unknown Artist',
                album: rawAlbum || 'Unknown Album',
                album_artist: rawAlbumArtist || null,
                track_number: common.track?.no || null,
                genre: common.genre ? common.genre[0] : null,
                year: common.year || null,
                duration: format.duration || 0,
                scanned_at: new Date().toISOString()
            };
        } catch (error) {
            // Fallback for minimal info if metadata extraction fails but file is valid
            const stats = await fsPromises.stat(filePath).catch(() => ({ size: 0 }));
            const fb1 = this._cleanFolderName(this._getFolderFallback(filePath, 1));
            const fb2 = this._cleanFolderName(this._getFolderFallback(filePath, 2));
            let artist = fb2 || 'Unknown Artist';
            let album = fb1 || 'Unknown Album';

            // Handle CD subfolders in fallback too
            if (/^(CD|Disc|Disk|Part)\s*\d+/i.test(album) && fb2) {
                album = fb2;
                const fb3 = this._cleanFolderName(this._getFolderFallback(filePath, 3));
                artist = fb3 || artist;
            }

            // Split "Artist - Album" in fallback
            if (artist.includes(' - ')) {
                const [p1, ...p2] = artist.split(' - ');
                artist = p1.trim();
                if (album === 'Unknown Album' && p2.length > 0) album = p2.join(' - ').trim();
            }

            return {
                id: this._generateId(filePath),
                file_path: filePath,
                file_size: stats.size,
                title: path.basename(filePath, path.extname(filePath)),
                artist: artist,
                album: album,
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
