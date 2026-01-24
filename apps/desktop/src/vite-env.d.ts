/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>
    export default component
}

interface Window {
    ipcRenderer: {
        autoUpdate: {
            checkForUpdates: () => void
            downloadUpdate: () => void
            installUpdate: () => void
            onChecking: (callback: () => void) => () => void
            onUpdateAvailable: (callback: (info: any) => void) => () => void
            onUpdateNotAvailable: (callback: (info: any) => void) => () => void
            onDownloadProgress: (callback: (progress: any) => void) => () => void
            onUpdateDownloaded: (callback: (info: any) => void) => () => void
            onError: (callback: (error: string) => void) => () => void
        }
    }
}
