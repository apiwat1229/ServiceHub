import { app, BrowserWindow } from 'electron'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
// In Electron, use process.resourcesPath for packaged apps
// This correctly points to the resources folder in the installed app
const __dirname = app.getAppPath()
const APP_ROOT = __dirname

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
// Disable security warnings in development (unsafe-eval is needed for source maps)
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

process.env.APP_ROOT = APP_ROOT

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  const bounds = store.get('windowBounds') as { width: number; height: number; x: number; y: number } | undefined;

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    frame: false,
    titleBarStyle: 'hidden',
    center: true, // Force center on every launch as requested
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.mjs'),
    },
    // Only restore size, not position, to ensure it always starts in the center
    // ...bounds, 
    // Default to a larger size suitable for Full HD (1920x1080)
    width: bounds?.width || 1600,
    height: bounds?.height || 900,
  })

  // Save window state
  win.on('resize', () => {
    if (win) {
      const { width, height } = win.getBounds();
      store.set('windowBounds', { ...store.get('windowBounds') as object, width, height });
    }
  });

  win.on('move', () => {
    if (win) {
      const { x, y } = win.getBounds();
      store.set('windowBounds', { ...store.get('windowBounds') as object, x, y });
    }
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // win.webContents.openDevTools()
    win.webContents.closeDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    // Open DevTools in production for debugging
    // win.webContents.openDevTools()
    win.webContents.closeDevTools()
  }

  // Toggle DevTools with F12 or Ctrl+Shift+I
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      win?.webContents.toggleDevTools()
      event.preventDefault()
    }
    if (input.control && input.shift && input.key.toLowerCase() === 'i' && input.type === 'keyDown') {
      win?.webContents.toggleDevTools()
      event.preventDefault()
    }
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

import { ipcMain } from 'electron'
import Store from 'electron-store'

const store = new Store();

ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val);
});

ipcMain.on('electron-store-set', async (_event, key, val) => {
  store.set(key, val);
});

ipcMain.on('electron-store-delete', async (_event, key) => {
  store.delete(key);
});

// Window Controls
ipcMain.on('window-minimize', () => {
  win?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (win?.isMaximized()) {
    win?.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on('window-close', () => {
  win?.close();
});

// Print Handler
ipcMain.on('print-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.webContents.print({
      silent: false,
      printBackground: true,
      margins: {
        marginType: 'none'
      }
    }, (success, errorType) => {
      if (!success) {
        console.log('Print failed:', errorType);
      }
    });
  }
});

// Preview Handler
ipcMain.handle('preview-window', async (event, title) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return false;

  try {
    const data = await window.webContents.printToPDF({
      printBackground: true,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      },
      pageSize: 'A4'
    });

    // Sanitize title to create a valid filename
    const safeTitle = (title || 'Print-Preview').replace(/[^a-z0-9\u0E00-\u0E7F\-\_\s]/gi, '').trim();
    const filename = `${safeTitle}.pdf`;
    const tempPath = path.join(os.tmpdir(), filename);

    fs.writeFileSync(tempPath, data);

    const previewWindow = new BrowserWindow({
      width: 1000,
      height: 900,
      title: title || 'Print Preview',
      icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
      webPreferences: {
        plugins: true // Enable PDF viewer
      }
    });

    // Prevent PDF viewer from changing the title
    previewWindow.on('page-title-updated', (e) => {
      e.preventDefault();
    });

    // Clean up file when window closes
    previewWindow.on('closed', () => {
      // Small delay to allow file release if needed
      setTimeout(() => {
        fs.unlink(tempPath, (err) => {
          if (err) console.error('Failed to cleanup temp PDF:', err);
        });
      }, 1000);
    });

    previewWindow.setMenu(null);
    previewWindow.loadURL(`file://${tempPath}`);

    return true;

  } catch (error) {
    console.error('Failed to generate PDF preview:', error);
    return false;
  }
});

// ============================================
// Auto-Update Configuration (DISABLED)
// ============================================
// Auto-update logic has been removed as per request.

app.whenReady().then(() => {
  createWindow()
})
