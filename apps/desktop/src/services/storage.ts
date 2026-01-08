export const storage = {
    get(key: string) {
        if (window.ipcRenderer && window.ipcRenderer.storage) {
            return window.ipcRenderer.storage.get(key);
        }
        // Fallback for non-electron env (e.g. browser dev)
        const val = localStorage.getItem(key);
        try {
            return val ? JSON.parse(val) : null;
        } catch {
            return val;
        }
    },
    set(key: string, value: any) {
        // Ensure value is serializable and not a Proxy
        const cleanValue = JSON.parse(JSON.stringify(value));
        if (window.ipcRenderer && window.ipcRenderer.storage) {
            window.ipcRenderer.storage.set(key, cleanValue);
        } else {
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
