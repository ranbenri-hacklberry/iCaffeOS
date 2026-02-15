export interface IElectronAPI {
    auth: {
        getMachineId: () => Promise<string>;
    };
    storage: {
        createBackup: () => Promise<{ success: boolean; path?: string; error?: string }>;
        getDiskStatus: () => Promise<{ free: number; total: number; usage: number }>;
    };
    display: {
        getHealth: () => Promise<{ isKiosk: boolean; isVisible: boolean; bounds: Electron.Rectangle }>;
        forceWake: () => Promise<void>;
    };
    system: {
        getTemperature: () => Promise<number>;
        restartApp: () => Promise<void>;
        getHealthStatus: () => Promise<{ status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL'; issues: string[] }>;
        onBootStatus: (callback: (status: { step: string; message: string; progress: number }) => void) => void;
    };
}

declare global {
    interface Window {
        electron: IElectronAPI;
    }
}
