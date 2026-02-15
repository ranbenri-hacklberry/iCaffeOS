import { BrowserWindow, app, RenderProcessGoneDetails, powerSaveBlocker, Details, ipcMain } from 'electron';

// --- 1. DISPLAY WATCHDOG (X11 + Electron) ---
class DisplayWatchdog {
    private window: BrowserWindow;
    private checkInterval: NodeJS.Timeout | null = null;
    private recoveryCount = 0;

    constructor(window: BrowserWindow) {
        this.window = window;
    }

    start(intervalMs = 5000) {
        this.checkInterval = setInterval(() => this.checkVisibility(), intervalMs);
    }

    stop() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    private async checkVisibility() {
        if (this.window.isDestroyed()) return;

        try {
            let needsRecovery = false;

            // Check Electron State
            if (!this.window.isVisible()) {
                console.warn('⚠️ Watchdog: Window is hidden');
                needsRecovery = true;
            }
            if (this.window.isMinimized()) {
                console.warn('⚠️ Watchdog: Window is minimized');
                needsRecovery = true;
            }
            // if (!this.window.isKiosk()) {
            //   console.warn('⚠️ Watchdog: Window is not in Kiosk mode');
            //   needsRecovery = true;
            // }

            const bounds = this.window.getBounds();
            if (bounds.width < 800 || bounds.height < 600) {
                console.warn('⚠️ Watchdog: Window is too small');
                needsRecovery = true;
            }

            if (needsRecovery) {
                this.recover();
            }
        } catch (e) {
            console.error('Watchdog Check Error:', e);
        }
    }

    private recover() {
        this.recoveryCount++;
        console.log(`Instructing Recovery (Attempt ${this.recoveryCount})...`);

        if (this.window.isMinimized()) this.window.restore();
        this.window.show();
        this.window.focus();

        // Only force kiosk if window was originally intended to be kiosk
        // and we are not in a 'stuck' state.
        // For now, let's make it conditional or record if it should be kiosk.
        // this.window.setKiosk(true); 

        // Immutable Power Save
        ipcMain.emit('hardware:request-power-save', null, true);
    }
}

// --- 2. RENDERER HEARTBEAT MONITOR ---
class RendererMonitor {
    private window: BrowserWindow;
    private lastPingTime: number = Date.now();
    private checkInterval: NodeJS.Timeout | null = null;
    private maxMissedPings = 5; // More grace for slow starts
    private pingTimeout = 60000; // 60s interval
    private restartCooldown = 0;

    constructor(window: BrowserWindow) {
        this.window = window;
    }

    start() {
        this.checkInterval = setInterval(() => this.checkHealth(), 10000);
    }

    recordPing() {
        this.lastPingTime = Date.now();
    }

    private checkHealth() {
        const now = Date.now();
        const timeSinceLastPing = now - this.lastPingTime;

        if (timeSinceLastPing > (this.pingTimeout * this.maxMissedPings)) {
            console.error(`🚨 Renderer Unresponsive! Last ping: ${timeSinceLastPing}ms ago.`);
            this.triggerReload();
        }
    }

    private triggerReload() {
        const now = Date.now();
        if (now - this.restartCooldown < 60000 * 2) {
            console.warn('Skipping watchdog reload due to cooldown');
            return;
        }

        console.log('🔄 Reloading Renderer...');
        this.window.reload();
        this.lastPingTime = Date.now();
        this.restartCooldown = Date.now();
    }
}


// --- 3. HARDWARE RESILIENCE (GPU CRASHES) ---
class HardwareResilience {
    private renderCrashTimes: number[] = [];
    private crashTimes: number[] = [];
    private windowLimit = 60000 * 10; // 10 minutes
    private maxCrashes = 3;

    constructor() {
        // Correct event signature for Electron 
        app.on('child-process-gone', (event, details) => {
            try {
                // details has { type, reason, exitCode, serviceName, name }
                if (details.type === 'GPU') {
                    this.handleGPUCrash(details.reason);
                }
            } catch (e) { }
        });

        app.on('render-process-gone', (event, webContents, details) => {
            try {
                console.error('Render Process Gone:', details.reason);
            } catch (ioErr) {
                // Ignore I/O errors if pipe is broken
            }

            if (details.reason !== 'clean-exit' && details.reason !== 'killed') {
                const now = Date.now();
                this.renderCrashTimes = this.renderCrashTimes.filter((t: number) => now - t < this.windowLimit);
                this.renderCrashTimes.push(now);

                // Throttling: Max 5 reloads in 10 minutes
                if (this.renderCrashTimes.length > 5) {
                    try {
                        console.error('🔥 CRITICAL: Too many render crashes. Stopping auto-reload to save system resources.');
                    } catch (e) { }
                    return;
                }

                // Increased delay to allow system to breathe
                setTimeout(() => {
                    try {
                        if (!webContents.isDestroyed()) {
                            console.log('🔄 Watchdog: Attempting renderer reload...');
                            webContents.reload();
                        }
                    } catch (e) { }
                }, 3000);
            }
        });
    }

    private handleGPUCrash(reason: string) {
        try {
            console.error('💥 GPU Process Crash:', reason);
        } catch (e) { }
        const now = Date.now();

        this.crashTimes = this.crashTimes.filter((t: number) => now - t < this.windowLimit);
        this.crashTimes.push(now);

        if (this.crashTimes.length >= this.maxCrashes) {
            try {
                console.error('🔥 Too many GPU crashes! Restarting with Software Rendering fallback...');
            } catch (e) { }
            app.relaunch({
                args: process.argv.slice(1).concat([
                    '--disable-gpu',
                    '--disable-software-rasterizer'
                ])
            });
            app.exit(0);
        }
    }
}

// --- FACTORY ---
export function initializeWatchdogs(window: BrowserWindow) {
    const display = new DisplayWatchdog(window);
    const renderer = new RendererMonitor(window);

    // Singleton hardware listener
    new HardwareResilience();

    display.start();
    renderer.start();

    return {
        display,
        renderer,
        recordPing: () => renderer.recordPing()
    };
}
