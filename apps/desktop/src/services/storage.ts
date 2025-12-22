export const storage = {
    get(key: string) {
        console.log(`[Storage] Getting key: ${key}`);
        if (window.ipcRenderer && window.ipcRenderer.storage) {
            console.log(`[Storage] Using IPC`);
            return window.ipcRenderer.storage.get(key);
        }
        console.log(`[Storage] Fallback to LocalStorage`);
        // Fallback for non-electron env (e.g. browser dev)
        const val = localStorage.getItem(key);
        try {
            return val ? JSON.parse(val) : null;
        } catch {
            return val;
        }
    },
    set(key: string, value: any) {
        console.log(`[Storage] Setting key: ${key}`, value);
        // Ensure value is serializable and not a Proxy
        const cleanValue = JSON.parse(JSON.stringify(value));
        if (window.ipcRenderer && window.ipcRenderer.storage) {
            console.log(`[Storage] Using IPC`);
            window.ipcRenderer.storage.set(key, cleanValue);
        } else {
            console.log(`[Storage] Fallback to LocalStorage`);
            localStorage.setItem(key, JSON.stringify(cleanValue));
        }
    },
    delete(key: string) {
        if (window.ipcRenderer && window.ipcRenderer.storage) {
            window.ipcRenderer.storage.delete(key);
        } else {
            localStorage.removeItem(key);
        }
    }
};
