const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopMonitor', {
  getSystemState: () => ipcRenderer.invoke('desktop-monitor:state'),
  captureCrmWindow: async () => {
    const jpeg = await ipcRenderer.invoke('desktop-monitor:capture');
    return jpeg ? `data:image/jpeg;base64,${jpeg}` : null;
  },
});

contextBridge.exposeInMainWorld('desktopMonitorConfig', {
  saveCrmUrl: (crmUrl) => ipcRenderer.invoke('desktop-monitor:save-settings', crmUrl),
});
