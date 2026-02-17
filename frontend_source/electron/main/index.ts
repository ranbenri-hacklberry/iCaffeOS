import * as electron from 'electron';
import type { BrowserWindow as BrowserWindowType } from 'electron';
const { app, BrowserWindow, ipcMain, screen, powerSaveBlocker, globalShortcut } = electron;
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import net from 'net';
import { fileURLToPath } from 'url';
import { machineId } from 'node-machine-id';
import { initializeHardwareModule } from './hardware';
import { initializeWatchdogs } from './watchdog';
import { DiscoveryService } from './DiscoveryService';
import { YouTubeService } from './YouTubeService';

const discoveryService = new DiscoveryService();
const youtubeService = new YouTubeService();

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🛡️ Safety: Prevent 'write EIO' and 'EPIPE' from crashing the main process
// This can happen if the terminal session is lost or I/O is blocked
process.stdout.on('error', (err: any) => { if (err.code === 'EPIPE' || err.code === 'EIO') return; });
process.stderr.on('error', (err: any) => { if (err.code === 'EPIPE' || err.code === 'EIO') return; });
process.on('uncaughtException', (err: any) => {
    if (err.code === 'EIO' || err.code === 'EPIPE') return;
    console.error('🔥 Uncaught Exception:', err);
});

// Service Dependency Check Constants
const PG_PORT = 5432;
const RAID_MOUNT = process.platform === 'linux' ? '/mnt/raid1' : path.join(app.getPath('userData'), 'data');
const MUSIC_ROOT = process.platform === 'darwin' ? '/Volumes/RANTUNES' : '/mnt/music_ssd';
const BACKEND_PORT = 8081;
const CHECK_INTERVAL = 1500;
const MAX_RETRIES = 10;

let mainWindow: BrowserWindowType | null = null;
let splashWindow: BrowserWindowType | null = null;
let appStatus: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL' = 'OPTIMAL';
let failureReasons: string[] = [];
let powerSaveId: number | null = null;

function togglePowerSave(enable: boolean) {
    if (enable && powerSaveId === null) {
        powerSaveId = powerSaveBlocker.start('prevent-display-sleep');
        console.log('🛡️ Power Save Blocker: Active');
    } else if (!enable && powerSaveId !== null) {
        powerSaveBlocker.stop(powerSaveId);
        powerSaveId = null;
        console.log('🛡️ Power Save Blocker: Inactive');
    }
}

// --- HELPER FUNCTIONS ---
function getYtDlpPath(): string {
    const isDev = !app.isPackaged;
    const platform = process.platform;
    const binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';

    if (isDev) {
        // In dev, assume it's in PATH
        return 'yt-dlp';
    }

    // In production, check resources/binaries
    const resourcePath = path.join(process.resourcesPath, 'binaries', binaryName);
    if (fs.existsSync(resourcePath)) {
        console.log(`Using bundled yt-dlp: ${resourcePath}`);
        return `"${resourcePath}"`;
    }

    console.warn('Bundled yt-dlp not found, falling back to global PATH');
    return 'yt-dlp';
}

// --- IPC HANDLERS ---
function setupIPC() {
    ipcMain.handle('auth:get-machine-id', async () => {
        try {
            return await machineId();
        } catch (e) {
            console.error('Failed to get machine ID:', e);
            return 'unknown-device-id';
        }
    });

    ipcMain.handle('display:force-wake', async () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    ipcMain.handle('display:get-health', async () => {
        if (mainWindow) {
            return {
                isKiosk: mainWindow.isKiosk(),
                isVisible: mainWindow.isVisible(),
                bounds: mainWindow.getBounds()
            };
        }
        return { isKiosk: false, isVisible: false, bounds: { x: 0, y: 0, width: 0, height: 0 } };
    });

    ipcMain.handle('system:restart-app', () => {
        app.relaunch();
        app.exit(0);
    });

    // NEW: System Health Channel
    ipcMain.handle('system:get-health-status', () => {
        return { status: appStatus, issues: failureReasons };
    });

    // --- MUSIC INGESTION (yt-dlp) ---
    ipcMain.handle('music:get-youtube-metadata', async (_, url) => {
        return new Promise((resolve, reject) => {
            const ytDlp = getYtDlpPath();
            exec(`${ytDlp} --dump-json --flat-playlist --no-warnings "${url}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error('yt-dlp metadata error:', stderr);
                    reject(stderr || error.message);
                    return;
                }
                try {
                    const data = JSON.parse(stdout);
                    resolve({
                        title: data.title,
                        uploader: data.uploader,
                        duration: data.duration,
                        thumbnail: data.thumbnail,
                        id: data.id
                    });
                } catch (e) {
                    reject('Failed to parse metadata');
                }
            });
        });
    });

    ipcMain.handle('music:download-youtube', async (_, { url, artist, album, title }) => {
        return new Promise((resolve, reject) => {
            // Sanitize inputs
            const safeArtist = artist.replace(/[^\w\s\u0590-\u05FF-]/g, '').trim() || 'Unknown Artist';
            const safeAlbum = album.replace(/[^\w\s\u0590-\u05FF-]/g, '').trim() || 'Unknown Album';
            const safeTitle = title.replace(/[^\w\s\u0590-\u05FF-]/g, '').trim() || 'Unknown Title';

            // 🚀 Dynamic Root Discovery
            let basePath = process.platform === 'darwin' ? '/Volumes/RANTUNES' : '/mnt/music_ssd';
            if (!fs.existsSync(basePath)) {
                basePath = path.join(os.homedir(), 'Music', 'iCaffe');
                console.warn(`⚠️ [Electron] Primary path not found. Falling back to local: ${basePath}`);
            }

            // Output format: Artist - Album/Title.mp3
            const folderName = `${safeArtist} - ${safeAlbum}`;
            const dirPath = path.join(basePath, folderName);
            const outputPath = path.join(dirPath, `${safeTitle}.%(ext)s`);

            // Ensure directory exists
            try {
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            } catch (err: any) {
                console.error('❌ [Electron] Failed to create directory:', err);
                return reject(`Failed to create directory: ${err.message}`);
            }

            const ytDlp = getYtDlpPath();
            const command = `${ytDlp} -x --audio-format mp3 --audio-quality 0 --add-metadata --embed-thumbnail -o "${outputPath}" "${url}"`;

            console.log('🎵 Executing DL:', command);

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('yt-dlp download error:', stderr);
                    reject(stderr || error.message);
                    return;
                }
                resolve({ success: true, path: outputPath.replace('%(ext)s', 'mp3') });
            });
        });
    });

    // --- EXTERNAL DISK INGESTION ---
    ipcMain.handle('disk:scan-request', async (_, dirPath) => {
        // Default to Ran1 if on Mac and no path provided
        const scanPath = dirPath || MUSIC_ROOT;
        console.log(`🔍 Scanning: ${scanPath}`);
        try {
            const tracks = await discoveryService.scanDirectory(scanPath);
            return { success: true, tracks };
        } catch (error: any) {
            console.error('Scan failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('disk:import-confirm', async (_, tracks) => {
        console.log(`💾 Importing ${tracks.length} tracks from external drive...`);
        return { success: true, count: tracks.length };
    });

    // --- YOUTUBE SMART SEARCH & QUOTA ---
    ipcMain.handle('youtube:search', async (_, query) => {
        return await youtubeService.search(query);
    });

    ipcMain.handle('youtube:test-api-key', async (_, key) => {
        return await youtubeService.testApiKey(key);
    });

    ipcMain.handle('youtube:quota-status', () => {
        return youtubeService.getQuotaStatus();
    });

    ipcMain.handle('youtube:get-playlist', async (_, { playlistId, pageToken }) => {
        return await youtubeService.getPlaylistItems(playlistId, pageToken);
    });

    // --- DRIVE MONITORING ---
    const volumesPath = '/Volumes';
    if (fs.existsSync(volumesPath)) {
        fs.watch(volumesPath, (eventType, filename) => {
            if (filename) {
                console.log(`📦 Drive Volume change detected: ${filename} (${eventType})`);
                const isMounted = fs.existsSync(path.join(volumesPath, filename));

                mainWindow?.webContents.send('system:volume-change', {
                    filename,
                    eventType,
                    isMounted
                });

                // --- CD DETECTION ---
                // Typical names for Audio CDs on macOS/Linux
                const cdNames = ['Audio CD', 'CD', 'sr0'];
                if (cdNames.some(name => filename.includes(name))) {
                    console.log(`📀 Physical CD event: ${filename} (Mounted: ${isMounted})`);
                    mainWindow?.webContents.send('system:cd-event', {
                        isMounted,
                        filename
                    });
                }
            }
        });
    }
}

// --- BOOT SEQUENCE LOGIC ---
async function checkServiceDependencies(updateStatus: (msg: string, progress: number) => void): Promise<boolean> {
    let isDegraded = false;
    failureReasons = [];

    // 1. Check RAID Mount
    updateStatus('Checking Storage...', 10);
    if (!fs.existsSync(RAID_MOUNT)) {
        console.warn(`⚠️ Storage path ${RAID_MOUNT} not found. Creating...`);
        try {
            fs.mkdirSync(RAID_MOUNT, { recursive: true });
        } catch (e) {
            isDegraded = true;
            failureReasons.push('STORAGE_ERROR');
        }
    }

    // 2. Check Database (Port 5432)
    updateStatus('Checking Database Status...', 30);
    const dbRunning = await isPortOpen(PG_PORT);
    if (!dbRunning) {
        updateStatus('Database down. Attempting recovery...', 35);
        // Special logic for local DB recovery could go here
    }

    // 3. Check Backend API (Port 8081)
    updateStatus('Checking Backend API...', 60);
    let apiRunning = await isPortOpen(BACKEND_PORT);

    if (!apiRunning) {
        updateStatus('Backend down. Starting automatically...', 65);
        const appPath = app.getAppPath();
        const rootPath = path.join(appPath, '..', '..'); // Assuming packaged structure

        // Try multiple locations for backend_server.js
        const pathsToTry = [
            path.join(appPath, 'backend_server.js'),
            path.join(process.cwd(), 'backend_server.js')
        ];

        let found = false;
        for (const p of pathsToTry) {
            if (fs.existsSync(p)) {
                console.log(`🚀 Launching backend process from: ${p}`);
                exec(`node "${p}"`, (err) => {
                    if (err) console.error('Backend process failed:', err);
                });
                found = true;
                break;
            }
        }

        if (!found) {
            console.warn('Backend script not found. Trying npm run start-backend...');
            exec('npm run start-backend');
        }

        // Wait for it to come up
        let retries = 0;
        while (retries < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, CHECK_INTERVAL));
            apiRunning = await isPortOpen(BACKEND_PORT);
            if (apiRunning) break;
            retries++;
            updateStatus(`Waiting for API (${retries}/${MAX_RETRIES})...`, 65 + (retries * 2));
        }
    }

    // 🚀 FINAL INTEGRITY CHECK (Before Home Screen)
    updateStatus('Final integrity check...', 92);
    const finalCheck = await isPortOpen(BACKEND_PORT);
    if (!finalCheck) {
        updateStatus('Checking once more...', 96);
        await new Promise(r => setTimeout(r, 1000));
    }

    appStatus = (isDegraded || !apiRunning) ? 'DEGRADED' : 'OPTIMAL';

    if (isDegraded) {
        updateStatus(`Booting in DEGRADED Mode: ${failureReasons.join(', ')}`, 90);
        await new Promise(r => setTimeout(r, 2000));
    } else {
        updateStatus('All Services Online!', 100);
        await new Promise(r => setTimeout(r, 500));
    }

    return true;
}

async function hardResetBackend() {
    console.log('🧹 Hard Reset: Cleaning up orphaned backend processes...');
    return new Promise((resolve) => {
        // Kill any process already listening on 8081 (Linux/Mac)
        const killCmd = process.platform === 'win32'
            ? `for /f "tokens=5" %a in ('netstat -aon ^| findstr :8081') do taskkill /f /pid %a`
            : `lsof -ti:8081 | xargs kill -9`;

        exec(killCmd, () => {
            // After killing, try to start fresh
            const appPath = app.getAppPath();
            const backendScript = path.join(appPath, 'backend_server.js');

            if (fs.existsSync(backendScript)) {
                exec(`node "${backendScript}"`);
            } else {
                exec('npm run start-backend');
            }
            setTimeout(resolve, 1000);
        });
    });
}

function isPortOpen(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const timeout = 1000;
        const socket = new net.Socket();

        socket.setTimeout(timeout);
        socket.once('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.once('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, '127.0.0.1', () => {
            socket.end();
            resolve(true);
        });
    });
}

function createSplashWindow(): BrowserWindowType {
    splashWindow = new BrowserWindow({
        width: 600,
        height: 350,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    splashWindow.loadURL(`data:text/html;charset=utf-8,
    <body style="background:#111;color:#eee;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;-webkit-app-region:drag;border:1px solid #333;">
      <h2 style="margin-bottom:5px;">iCaffeOS booting...</h2>
      <div id="status" style="margin-top:20px;color:#888;font-size:14px;">Initializing...</div>
      <div style="width:80%;height:4px;background:#333;margin-top:15px;border-radius:2px;">
        <div id="bar" style="width:0%;height:100%;background:#00bcd4;transition:width 0.3s;border-radius:2px;"></div>
      </div>
      <div id="warn" style="margin-top:20px;color:#ff9800;font-size:12px;height:20px;"></div>
      <script>
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('boot-update', (event, { message, progress }) => {
          const statusEl = document.getElementById('status');
          statusEl.innerText = message;
          document.getElementById('bar').style.width = progress + '%';
          
          if (message.includes('DEGRADED')) {
             document.getElementById('bar').style.background = '#ff9800';
             statusEl.style.color = '#ff9800';
          }
        });
      </script>
    </body>
  `);

    return splashWindow;
}

async function createMainWindow(): Promise<BrowserWindowType> {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "iCaffeOS",
        kiosk: false, // Temporary false to debug visibility
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        // Use appPath for absolute reliability in production
        const appPath = app.getAppPath();
        mainWindow.loadFile(path.join(appPath, 'build/index.html'));
    }

    togglePowerSave(true);

    // 🛠️ DEBUG: Open DevTools automatically to catch "black screen" errors
    mainWindow.webContents.openDevTools({ mode: 'detach' });

    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }
        mainWindow?.show();
    });

    return mainWindow;
}

// --- APP LIFECYCLE ---
app.whenReady().then(async () => {
    setupIPC();
    createSplashWindow();

    // 🛡️ SAFETY SHORTCUTS (Emergency Exit)
    globalShortcut.register('CommandOrControl+Option+Q', () => {
        console.log('🚨 Emergency Exit Triggered');
        app.quit();
    });

    globalShortcut.register('CommandOrControl+Option+I', () => {
        mainWindow?.webContents.toggleDevTools();
    });

    // Run Boot Checks
    await checkServiceDependencies((message, progress) => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.webContents.send('boot-update', { message, progress });
        }
    });

    // Always launch, but appStatus will determine UI behavior via IPC
    await createMainWindow();

    if (mainWindow) {
        const { monitor, logger } = initializeHardwareModule(mainWindow);
        // Start monitoring in production or when explicitly needed
        monitor.startMonitoring();
        logger.startStreaming();

        const { recordPing } = initializeWatchdogs(mainWindow);
        // Connect renderer heartbeat to watchdog
        ipcMain.on('renderer:ping', () => recordPing());
        ipcMain.on('hardware:request-power-save', (_, enable) => togglePowerSave(enable));
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
