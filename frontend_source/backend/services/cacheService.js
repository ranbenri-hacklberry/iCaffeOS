import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const CACHE_DIR = process.env.RANTUNES_CACHE_DIR || './music_cache';
const MAX_CACHE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

export class CacheService {
    /**
     * Initialize cache directory
     */
    static async init() {
        try {
            const absolutePath = path.resolve(CACHE_DIR);
            await fs.mkdir(absolutePath, { recursive: true });
            console.log(`🎵 Cache directory ready: ${absolutePath}`);
        } catch (error) {
            console.error('❌ Failed to create cache directory:', error);
        }
    }

    /**
     * Get current cache total size in bytes
     */
    static async getCacheUsage() {
        let totalSize = 0;
        try {
            const files = await fs.readdir(CACHE_DIR);
            for (const file of files) {
                if (file.endsWith('.cache')) {
                    const stats = await fs.stat(path.join(CACHE_DIR, file));
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            console.error('Error calculating cache usage:', error);
        }
        return totalSize;
    }

    /**
     * Check if a song is cached locally
     */
    static async isCached(songId) {
        const filePath = path.join(CACHE_DIR, `${songId}.cache`);
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Copy song file to internal cache buffer
     */
    static async cacheSong(songId, sourcePath) {
        const destPath = path.join(CACHE_DIR, `${songId}.cache`);

        // Check if already cached
        try {
            await fs.access(destPath);
            const stats = await fs.stat(destPath);
            return { success: true, alreadyCached: true, size: stats.size };
        } catch { }

        try {
            // Verify source exists
            const stat = await fs.stat(sourcePath);

            // Tiered storage check
            const currentUsage = await this.getCacheUsage();
            if (currentUsage + stat.size > MAX_CACHE_SIZE) {
                console.warn(`⚠️ Cache limit reached. Total: ${(currentUsage / 1024 / 1024).toFixed(2)}MB. Cannot add ${songId} (${(stat.size / 1024 / 1024).toFixed(2)}MB)`);
                return { success: false, error: 'Cache limit reached', currentUsage, required: stat.size };
            }

            // Perform copy via streams
            await pipeline(
                createReadStream(sourcePath),
                createWriteStream(destPath)
            );

            console.log(`📥 Cached song ${songId} to internal buffer. Size: ${(stat.size / 1024 / 1024).toFixed(2)}MB`);
            return { success: true, size: stat.size };
        } catch (error) {
            console.error(`❌ Failed to cache song ${songId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove song from cache
     */
    static async removeFromCache(songId) {
        const filePath = path.join(CACHE_DIR, `${songId}.cache`);
        try {
            await fs.unlink(filePath);
            console.log(`🗑️ Removed song ${songId} from internal cache`);
            return { success: true };
        } catch (error) {
            if (error.code === 'ENOENT') return { success: true, alreadyGone: true };
            console.error(`❌ Failed to delete cached file for ${songId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get absolute path for a cached file
     */
    static getCachePath(songId) {
        return path.resolve(path.join(CACHE_DIR, `${songId}.cache`));
    }

    /**
     * Cleanup strategy: Delete specifically identified IDs 
     * (LRU logic is frontend-driven via Dexie, so backend just follows orders)
     */
    static async batchRemove(songIds) {
        const results = [];
        for (const id of songIds) {
            const res = await this.removeFromCache(id);
            results.push({ id, ...res });
        }
        return results;
    }
}
