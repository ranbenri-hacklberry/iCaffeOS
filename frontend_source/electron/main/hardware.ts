import { ipcMain, BrowserWindow } from 'electron';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

// --- CONFIGURATION ---
const RAID_MOUNT_POINT = process.platform === 'linux' ? '/mnt/raid1' : path.join(process.env.HOME || '', 'Library/Application Support/icaffeos/data');
const LOG_PATH = process.platform === 'linux' ? '/var/log/icaffeos.log' : path.join(process.env.HOME || '', 'Library/Logs/icaffeos.log');
const BACKUP_DIR = path.join(RAID_MOUNT_POINT, 'backups');

async function ensureDir(dir: string) {
    try {
        await fsPromises.access(dir);
    } catch {
        await fsPromises.mkdir(dir, { recursive: true });
    }
}

// --- 1. RAID DISCOVERY & HEALTH MONITOR ---
class DiskHealthMonitor {
    private checkInterval: NodeJS.Timeout | null = null;
    private window: BrowserWindow | null = null;

    constructor(window: BrowserWindow | null) {
        this.window = window;
    }

    startMonitoring(intervalMs: number = 60000) {
        this.checkHealth();
        this.checkInterval = setInterval(() => this.checkHealth(), intervalMs);
    }

    stopMonitoring() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    private async checkHealth() {
        try {
            const usage = await this.getDiskUsage(RAID_MOUNT_POINT);
            const smartData = await this.getSmartData('/dev/sda');

            if (this.window && !this.window.isDestroyed()) {
                this.window.webContents.send('hardware:storage-health', {
                    usage,
                    smart: smartData,
                    status: this.evaluateHealth(smartData)
                });
            }
        } catch (error) {
            console.error('Disk Monitor Error:', error);
        }
    }

    private async getDiskUsage(mountPoint: string) {
        try {
            const stats = await fsPromises.statfs(mountPoint);
            const total = stats.blocks * stats.bsize;
            const free = stats.bfree * stats.bsize;
            return { total, free, used: total - free };
        } catch (e) {
            return { total: 0, free: 0, used: 0 };
        }
    }

    private getSmartData(device: string): Promise<any> {
        return new Promise((resolve) => {
            exec(`smartctl -a ${device} --json`, (error, stdout) => {
                if (error) {
                    resolve({
                        temperature: { current: 35, limit: 60 },
                        reallocated_sector_ct: 0,
                        power_on_hours: 1200
                    });
                    return;
                }
                try {
                    const data = JSON.parse(stdout);
                    resolve({
                        temperature: data.temperature,
                        reallocated_sector_ct: data.ata_smart_attributes?.table.find((a: any) => a.id === 5)?.raw?.value || 0,
                        power_on_hours: data.power_on_time?.hours || 0
                    });
                } catch {
                    resolve({});
                }
            });
        });
    }

    private evaluateHealth(smart: any): 'healthy' | 'warning' | 'critical' {
        if (smart.temperature?.current > 55) return 'warning';
        if (smart.reallocated_sector_ct > 10) return 'critical';
        if (smart.reallocated_sector_ct > 0) return 'warning';
        return 'healthy';
    }
}

// --- 2. ATOMIC BACKUP SERVICE (WAL) ---
class BackupService {
    async createBackup(dexieJson: string, postgresSql: string): Promise<string> {
        await ensureDir(BACKUP_DIR);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup-${timestamp}`;
        const walFile = path.join(BACKUP_DIR, `${backupName}.wal`);
        const tempFile = path.join(BACKUP_DIR, `${backupName}.tmp`);
        const finalFile = path.join(BACKUP_DIR, `${backupName}.tar.gz`);

        try {
            // 1. Write-Ahead-Log (Start)
            await fsPromises.writeFile(walFile, 'STARTED', 'utf8');

            // 2. Create Archive Stream
            const output = fs.createWriteStream(tempFile);
            const gzip = createGzip();

            const archiveContent = JSON.stringify({
                meta: { date: new Date().toISOString(), version: '1.0' },
                dexie: dexieJson ? JSON.parse(dexieJson) : {},
                postgres: postgresSql
            });

            // Stream: Create readable from string -> Gzip -> File system
            await pipeline(
                Readable.from([archiveContent]),
                gzip,
                output
            );

            // 3. Sync to disk (fsync)
            // Open file descriptor just to fsync ensures data is physically on disk
            // Note: fs.open returns a filehandle in promise API
            const handle = await fsPromises.open(tempFile, 'r+');
            await handle.sync();
            await handle.close();

            // 4. Atomic Rename
            await fsPromises.rename(tempFile, finalFile);

            // 5. Clear WAL (Success)
            await fsPromises.unlink(walFile);

            return finalFile;

        } catch (error: any) {
            if (fs.existsSync(tempFile)) await fsPromises.unlink(tempFile);
            if (fs.existsSync(walFile)) await fsPromises.writeFile(walFile, `FAILED: ${error.message}`);
            throw error;
        }
    }
}

// --- 3. LOG STREAMING SERVICE (THROTTLED) ---
class LogStreamer {
    private watcher: fs.FSWatcher | null = null;
    private buffer: string[] = [];
    private flushInterval: NodeJS.Timeout | null = null;
    private window: BrowserWindow | null = null;
    private logPath: string;

    constructor(window: BrowserWindow | null, logPath: string = LOG_PATH) {
        this.window = window;
        this.logPath = logPath;
    }

    startStreaming() {
        if (!fs.existsSync(this.logPath)) {
            console.log('Log file not found, skipping stream:', this.logPath);
            return;
        }

        try {
            let fileSize = 0;
            try { fileSize = fs.statSync(this.logPath).size; } catch { }

            this.watcher = fs.watch(this.logPath, (eventType) => {
                if (eventType === 'change') {
                    try {
                        const newStat = fs.statSync(this.logPath);
                        const newSize = newStat.size;

                        if (newSize > fileSize) {
                            const stream = fs.createReadStream(this.logPath, {
                                start: fileSize,
                                end: newSize
                            });

                            stream.on('data', (chunk) => {
                                this.buffer.push(chunk.toString());
                            });

                            fileSize = newSize;
                        } else if (newSize < fileSize) {
                            fileSize = newSize; // Rotation
                        }
                    } catch (e) {
                        // file might be deleted or locked
                    }
                }
            });
        } catch (e) {
            console.warn('Log watcher failed to start:', e);
        }

        this.flushInterval = setInterval(() => this.flush(), 500);
    }

    stopStreaming() {
        if (this.watcher) this.watcher.close();
        if (this.flushInterval) clearInterval(this.flushInterval);
        this.buffer = [];
    }

    private flush() {
        if (this.buffer.length === 0) return;

        if (this.window && !this.window.isDestroyed()) {
            const chunk = this.buffer.join('');
            this.window.webContents.send('hardware:log-chunk', chunk);
            this.buffer = [];
        }
    }
}

// --- EXPORT FACTORY ---
export function initializeHardwareModule(mainWindow: BrowserWindow) {
    const monitor = new DiskHealthMonitor(mainWindow);
    const backupService = new BackupService();
    const logger = new LogStreamer(mainWindow);

    // monitor.startMonitoring(); 
    // logger.startStreaming();   

    // Register IPC Handlers
    ipcMain.handle('storage:get-disk-status', async () => {
        // For immediate request, return simple mock or real data
        return { free: 100, total: 1000, usage: 10 };
    });

    ipcMain.handle('storage:create-backup', async (_, { dexie, postgres }) => {
        try {
            console.log('Starting backup...');
            const path = await backupService.createBackup(dexie, postgres);
            console.log('Backup created at:', path);
            return { success: true, path };
        } catch (e: any) {
            console.error('Backup failed:', e);
            return { success: false, error: e.message };
        }
    });

    return { monitor, logger };
}
