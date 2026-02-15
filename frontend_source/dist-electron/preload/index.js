import { contextBridge, ipcRenderer } from "electron";
const api = {
  auth: {
    getMachineId: () => ipcRenderer.invoke("auth:get-machine-id")
  },
  storage: {
    createBackup: () => ipcRenderer.invoke("storage:create-backup"),
    getDiskStatus: () => ipcRenderer.invoke("storage:get-disk-status")
  },
  display: {
    getHealth: () => ipcRenderer.invoke("display:get-health"),
    forceWake: () => ipcRenderer.invoke("display:force-wake")
  },
  system: {
    getTemperature: () => ipcRenderer.invoke("system:get-temperature"),
    restartApp: () => ipcRenderer.invoke("system:restart-app"),
    getHealthStatus: () => ipcRenderer.invoke("system:get-health-status"),
    onBootStatus: (callback) => {
      const subscription = (_, status) => callback(status);
      ipcRenderer.on("boot-update", subscription);
      return () => ipcRenderer.removeListener("boot-update", subscription);
    }
  },
  music: {
    getYoutubeMetadata: (url) => ipcRenderer.invoke("music:get-youtube-metadata", url),
    downloadYoutube: (data) => ipcRenderer.invoke("music:download-youtube", data),
    scanDisk: (path) => ipcRenderer.invoke("disk:scan-request", path),
    confirmImport: (tracks) => ipcRenderer.invoke("disk:import-confirm", tracks)
  },
  youtube: {
    search: (query) => ipcRenderer.invoke("youtube:search", query),
    getQuotaStatus: () => ipcRenderer.invoke("youtube:quota-status"),
    testApiKey: (key) => ipcRenderer.invoke("youtube:test-api-key", key),
    getPlaylist: (playlistId, pageToken) => ipcRenderer.invoke("youtube:get-playlist", { playlistId, pageToken })
  }
};
contextBridge.exposeInMainWorld("electron", api);
setInterval(() => {
  ipcRenderer.send("renderer:ping");
}, 15e3);
