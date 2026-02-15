const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const axios = require('axios');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        fullscreen: !isDev,
        kiosk: !isDev,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#000000'
    });

    // Remove menu
    mainWindow.setMenuBarVisibility(false);

    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../frontend_source/dist/index.html')}`;

    console.log(`🚀 Loading URL: ${startUrl}`);
    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Check local backend health
async function checkBackendHealth() {
    try {
        const response = await axios.get('http://localhost:8081/health', { timeout: 2000 });
        return response.status === 200;
    } catch (err) {
        return false;
    }
}

app.whenReady().then(async () => {
    console.log('📦 iCaffe OS (N150 Wrapper) starting...');

    // Initial health check
    let isHealthy = await checkBackendHealth();
    if (!isHealthy) {
        console.log('⚠️ Local backend not ready. Waiting...');
        // We could show a splash screen here, but for now we just log and proceed
    }

    createWindow();

    // Start Telemetry Loop
    startTelemetryLoop();

    // Report Boot
    setTimeout(() => {
        if (mainWindow) {
            mainWindow.webContents.send('telemetry-update', {
                event: 'SYSTEM_BOOT',
                timestamp: new Date().toISOString(),
                hostname: os.hostname()
            });
        }
    }, 5000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// --- IPC Listeners ---

ipcMain.handle('execute-command', async (event, command) => {
    console.log(`🛠️ Executing command: ${command}`);

    // Whitelist safe commands
    const safeCommands = ['docker-compose restart', 'docker-compose pull', 'npm run build'];
    if (!safeCommands.includes(command) && !command.startsWith('docker logs')) {
        return { error: 'Command not allowed' };
    }

    return new Promise((resolve) => {
        exec(command, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
            resolve({
                success: !error,
                stdout: stdout,
                stderr: stderr
            });
        });
    });
});

ipcMain.handle('get-system-logs', async (event, lines = 100) => {
    return new Promise((resolve) => {
        // Try reading docker logs for the manager service
        exec(`docker logs --tail ${lines} manager-container`, (error, stdout, stderr) => {
            resolve(stdout || stderr || 'No logs found');
        });
    });
});

ipcMain.handle('get-system-stats', async () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus();

    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpuCount: cpus.length,
        memory: {
            total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            usage: ((1 - freeMem / totalMem) * 100).toFixed(1) + '%'
        },
        uptime: (os.uptime() / 3600).toFixed(1) + ' hours'
    };
});

// --- Telemetry Service ---

function startTelemetryLoop() {
    setInterval(async () => {
        try {
            const stats = {
                timestamp: new Date().toISOString(),
                hostname: os.hostname(),
                memory: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1),
                backendHealthy: await checkBackendHealth()
            };

            if (mainWindow) {
                mainWindow.webContents.send('telemetry-update', stats);
            }

            // Black Box: Check for critical errors in logs
            exec('docker logs --tail 50 manager-container', (err, stdout) => {
                if (stdout && (stdout.includes('ERROR') || stdout.includes('FATAL'))) {
                    mainWindow?.webContents.send('telemetry-update', {
                        event: 'CRITICAL_LOG',
                        message: stdout.split('\n').filter(l => l.includes('ERROR') || l.includes('FATAL')).pop(),
                        timestamp: new Date().toISOString()
                    });
                }
            });

        } catch (err) {
            console.error('Telemetry err:', err);
        }
    }, 60000); // 60 seconds
}
