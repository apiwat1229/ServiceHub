import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  storage: {
    get: (key: string) => ipcRenderer.sendSync('electron-store-get', key),
    set: (key: string, value: any) => ipcRenderer.send('electron-store-set', key, value),
    delete: (key: string) => ipcRenderer.send('electron-store-delete', key),
  },

  // Window Controls
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  },

  // Auto-Update APIs
  autoUpdate: {
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    downloadUpdate: () => ipcRenderer.send('download-update'),
    installUpdate: () => ipcRenderer.send('install-update'),

    onChecking: (callback: () => void) => {
      ipcRenderer.on('update-checking', callback)
      return () => ipcRenderer.removeListener('update-checking', callback)
    },
    onUpdateAvailable: (callback: (info: any) => void) => {
      ipcRenderer.on('update-available', (_event, info) => callback(info))
      return () => ipcRenderer.removeAllListeners('update-available')
    },
    onUpdateNotAvailable: (callback: (info: any) => void) => {
      ipcRenderer.on('update-not-available', (_event, info) => callback(info))
      return () => ipcRenderer.removeAllListeners('update-not-available')
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('download-progress', (_event, progress) => callback(progress))
      return () => ipcRenderer.removeAllListeners('download-progress')
    },
    onUpdateDownloaded: (callback: (info: any) => void) => {
      ipcRenderer.on('update-downloaded', (_event, info) => callback(info))
      return () => ipcRenderer.removeAllListeners('update-downloaded')
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('update-error', (_event, error) => callback(error))
      return () => ipcRenderer.removeAllListeners('update-error')
    },
  },

  // You can expose other APTs you need here.
  // ...
})
