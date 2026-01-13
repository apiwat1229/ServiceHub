/// <reference types="vite/client" />

interface Window {
    ipcRenderer: {
        storage: {
            get: (key: string) => any;
            set: (key: string, value: any) => void;
            delete: (key: string) => void;
        };
    };
}

declare module 'vue3-barcode';
