import path from 'path';
import os from 'os';
import fs from 'fs';

/**
 * Dynamic Path Manager for Music
 * STAGING_PATH: Local storage (~/Music/iCaffe/Staging)
 * EXTERNAL_PATH: External drive (/Volumes/RANTUNES)
 */
export const PathManager = {
    EXTERNAL_ROOT: process.platform === 'darwin' ? '/Volumes/RANTUNES' : '/mnt/music_ssd',
    STAGING_ROOT: path.join(os.homedir(), 'Music', 'iCaffe'),

    isExternalMounted() {
        return fs.existsSync(this.EXTERNAL_ROOT);
    },

    getPrimaryPath() {
        return this.isExternalMounted() ? this.EXTERNAL_ROOT : this.STAGING_ROOT;
    },

    ensureStagingExists() {
        if (!fs.existsSync(this.STAGING_ROOT)) {
            fs.mkdirSync(this.STAGING_ROOT, { recursive: true });
        }
    },

    /**
     * Converts a staging path to an external path
     */
    convertToExternal(filePath) {
        if (filePath.startsWith(this.STAGING_ROOT)) {
            return filePath.replace(this.STAGING_ROOT, this.EXTERNAL_ROOT);
        }
        return filePath;
    },

    /**
     * Recursively calculate directory size in bytes
     */
    getFolderSize(dirPath) {
        let size = 0;
        if (!fs.existsSync(dirPath)) return 0;

        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                size += this.getFolderSize(fullPath);
            } else {
                size += stats.size;
            }
        }
        return size;
    },

    async getLibraryStats() {
        const stagingSize = this.getFolderSize(this.STAGING_ROOT);
        const externalSize = this.isExternalMounted() ? this.getFolderSize(this.EXTERNAL_ROOT) : 0;

        return {
            stagingBytes: stagingSize,
            externalBytes: externalSize,
            totalBytes: stagingSize + externalSize,
            totalGB: ((stagingSize + externalSize) / (1024 ** 3)).toFixed(2)
        };
    }
};

export default PathManager;
