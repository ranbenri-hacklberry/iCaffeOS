import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import * as mm from 'music-metadata';
import crypto from 'crypto';

interface DiscoveredTrack {
    filePath: string;
    title: string;
    artist: string;
    album: string;
    genre: string;
    year: number | null;
    duration: number;
    format: string;
    coverPath?: string;
    hash: string;
}

export class DiscoveryService {
    private cacheDir: string;

    constructor() {
        this.cacheDir = path.join(app.getPath('userData'), 'cover_cache');
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    async scanDirectory(dirPath: string): Promise<DiscoveredTrack[]> {
        const results: DiscoveredTrack[] = [];

        if (!fs.existsSync(dirPath)) {
            console.warn(`Directory not found: ${dirPath}`);
            return [];
        }

        const files = await this.getFilesRecursively(dirPath);

        for (const file of files) {
            try {
                const metadata = await mm.parseFile(file);
                const coverPath = await this.cacheCoverArt(metadata, file);

                // fallback to filename if no title
                const filename = path.basename(file, path.extname(file));
                const title = metadata.common.title || filename;
                const artist = metadata.common.artist || 'Unknown Artist';
                const album = metadata.common.album || 'Unknown Album';

                // Generate simple hash for dup detection
                // (In real usage, maybe hash first 1MB of file for speed)
                const hash = crypto.createHash('md5').update(`${title}-${artist}-${metadata.format.duration}`).digest('hex');

                results.push({
                    filePath: file,
                    title,
                    artist,
                    album,
                    genre: metadata.common.genre?.[0] || 'Uncategorized',
                    year: metadata.common.year || null,
                    duration: metadata.format.duration || 0,
                    format: metadata.format.container || 'mp3',
                    coverPath,
                    hash
                });
            } catch (err: any) {
                console.warn(`Failed to parse ${file}:`, err?.message || err);
            }
        }

        return results;
    }

    private async getFilesRecursively(dir: string): Promise<string[]> {
        const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(dirents.map((dirent) => {
            const res = path.resolve(dir, dirent.name);
            return dirent.isDirectory() ? this.getFilesRecursively(res) : res;
        }));
        return Array.prototype.concat(...files).filter(f => /\.(mp3|wav|flac|m4a|aac)$/i.test(f));
    }

    private async cacheCoverArt(metadata: mm.IAudioMetadata, filePath: string): Promise<string | undefined> {
        const picture = metadata.common.picture?.[0];
        if (!picture) return undefined;

        const hash = crypto.createHash('md5').update(filePath).digest('hex');
        const fileName = `${hash}.jpg`;
        const destPath = path.join(this.cacheDir, fileName);

        if (!fs.existsSync(destPath)) {
            await fs.promises.writeFile(destPath, picture.data);
        }

        return `file://${destPath}`;
    }
}
