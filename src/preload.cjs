const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    log: (message) => ipcRenderer.invoke('logger', 'log', message),
    error: (message) => ipcRenderer.invoke('logger', 'error', message),
    readLog: () => ipcRenderer.invoke('logger', 'read'),
    clearLog: () => ipcRenderer.invoke('logger', 'clear'),
    readConfig: () => ipcRenderer.invoke('config', 'read'),
    saveConfig: (data) => ipcRenderer.invoke('config', 'save', data),
    readBlog: () => ipcRenderer.invoke('blogs', 'read'),
    saveBlog: (data) => ipcRenderer.invoke('blogs', 'save', data),
    getBlog: (slug) => ipcRenderer.invoke('blogs', 'get', slug),
    deleteBlog: (slug) => ipcRenderer.invoke('blogs', 'delete', slug)
});