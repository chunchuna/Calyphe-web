const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// 向渲染进程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
    loadMapFile: (filePath) => ipcRenderer.invoke('load-map-file', filePath),
    saveGame: (saveData, filename) => ipcRenderer.invoke('save-game', saveData, filename),
    loadGame: (filename) => ipcRenderer.invoke('load-game', filename),
    getSaveFiles: () => ipcRenderer.invoke('get-save-files')
}); 