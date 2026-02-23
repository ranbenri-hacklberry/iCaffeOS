import { contextBridge as s, ipcRenderer as e } from "electron";
const i = {
  auth: {
    getMachineId: () => e.invoke("auth:get-machine-id")
  },
  storage: {
    createBackup: () => e.invoke("storage:create-backup"),
    getDiskStatus: () => e.invoke("storage:get-disk-status")
  },
  display: {
    getHealth: () => e.invoke("display:get-health"),
    forceWake: () => e.invoke("display:force-wake")
  },
  system: {
    getTemperature: () => e.invoke("system:get-temperature"),
    restartApp: () => e.invoke("system:restart-app"),
    getHealthStatus: () => e.invoke("system:get-health-status"),
    onBootStatus: (t) => {
      const o = (u, a) => t(a);
      return e.on("boot-update", o), () => e.removeListener("boot-update", o);
    }
  },
  music: {
    getYoutubeMetadata: (t) => e.invoke("music:get-youtube-metadata", t),
    downloadYoutube: (t) => e.invoke("music:download-youtube", t),
    scanDisk: (t) => e.invoke("disk:scan-request", t),
    confirmImport: (t) => e.invoke("disk:import-confirm", t)
  },
  youtube: {
    search: (t) => e.invoke("youtube:search", t),
    getQuotaStatus: () => e.invoke("youtube:quota-status"),
    testApiKey: (t) => e.invoke("youtube:test-api-key", t),
    getPlaylist: (t, o) => e.invoke("youtube:get-playlist", { playlistId: t, pageToken: o })
  }
};
s.exposeInMainWorld("electron", i);
setInterval(() => {
  e.send("renderer:ping");
}, 15e3);
