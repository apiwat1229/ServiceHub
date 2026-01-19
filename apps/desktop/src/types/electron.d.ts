// TypeScript definitions for Electron IPC

interface AutoUpdateAPI {
    checkForUpdates: () => void
    downloadUpdate: () => void
    installUpdate: () => void
    onChecking: (callback: () => void) => () => void
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void
    onUpdateNotAvailable: (callback: (info: UpdateInfo) => void) => () => void
    onDownloadProgress: (callback: (progress: ProgressInfo) => void) => () => void
    onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => () => void
    onError: (callback: (error: string) => void) => () => void
}

interface UpdateInfo {
    version: string
    releaseDate: string
    releaseNotes?: string
}

interface ProgressInfo {
    total: number
    delta: number
    transferred: number
    percent: number
    bytesPerSecond: number
}

interface IpcRenderer {
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
    off: (channel: string, listener?: (...args: any[]) => void) => void
    send: (channel: string, ...args: any[]) => void
    invoke: (channel: string, ...args: any[]) => Promise<any>

    storage: {
        get: (key: string) => any
        set: (key: string, value: any) => void
        delete: (key: string) => void
    }

    window: {
        minimize: () => void
        maximize: () => void
        close: () => void
    }

    autoUpdate: AutoUpdateAPI
}

declare global {
    interface Window {
        ipcRenderer?: IpcRenderer
    }
}

export { }

