const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {
  scanOS: () => ipcRenderer.invoke('scan-os'),
  scanBrowserExtensions: () => ipcRenderer.invoke('scan-browser-extensions'),
});

