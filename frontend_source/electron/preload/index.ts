
import { contextBridge, ipcRenderer } from 'electron';

const api = {
    auth: {
        getMachineId: () => ipcRenderer.invoke('auth:get-machine-id'),
    },
    storage: {
        createBackup: () => ipcRenderer.invoke('storage:create-backup'),
        getDiskStatus: () => ipcRenderer.invoke('storage:get-disk-status'),
    },
    display: {
        getHealth: () => ipcRenderer.invoke('display:get-health'),
        forceWake: () => ipcRenderer.invoke('display:force-wake'),
    },
    system: {
        getTemperature: () => ipcRenderer.invoke('system:get-temperature'),
        restartApp: () => ipcRenderer.invoke('system:restart-app'),
        getHealthStatus: () => ipcRenderer.invoke('system:get-health-status'),
        onBootStatus: (callback: (status: any) => void) => {
            const subscription = (_: any, status: any) => callback(status);
            ipcRenderer.on('boot-update', subscription);
            return () => ipcRenderer.removeListener('boot-update', subscription);
        },
    },
    music: {
        getYoutubeMetadata: (url: string) => ipcRenderer.invoke('music:get-youtube-metadata', url),
        downloadYoutube: (data: { url: string, artist: string, album: string, title: string }) => ipcRenderer.invoke('music:download-youtube', data),
        scanDisk: (path?: string) => ipcRenderer.invoke('disk:scan-request', path),
        confirmImport: (tracks: any[]) => ipcRenderer.invoke('disk:import-confirm', tracks),
    },
    youtube: {
        search: (query: string) => ipcRenderer.invoke('youtube:search', query),
        getQuotaStatus: () => ipcRenderer.invoke('youtube:quota-status'),
        testApiKey: (key: string) => ipcRenderer.invoke('youtube:test-api-key', key),
        getPlaylist: (playlistId: string, pageToken?: string) => ipcRenderer.invoke('youtube:get-playlist', { playlistId, pageToken }),
    },
};

contextBridge.exposeInMainWorld('electron', api);

// 💓 Renderer Heartbeat: ping main process watchdog every 15s to prevent forced reload
setInterval(() => {
    ipcRenderer.send('renderer:ping');
}, 15000);
