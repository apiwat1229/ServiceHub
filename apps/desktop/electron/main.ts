import { app, BrowserWindow } from 'electron'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
// In Electron, use process.resourcesPath for packaged apps
// This correctly points to the resources folder in the installed app
const __dirname = app.isPackaged
  ? process.resourcesPath
  : path.join(app.getAppPath(), 'dist-electron')

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  const bounds = store.get('windowBounds') as { width: number; height: number; x: number; y: number } | undefined;

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    frame: false,
    titleBarStyle: 'hidden',
    center: true, // Force center on every launch as requested
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'dist-electron', 'preload.mjs')
        : path.join(__dirname, 'preload.mjs'),
    },
    // Only restore size, not position, to ensure it always starts in the center
    // ...bounds, 
    width: bounds?.width || 1200,
    height: bounds?.height || 800,
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
    win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    // Open DevTools in production for debugging
    win.webContents.openDevTools()
  }
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
// Auto-Update Configuration
// ============================================
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'

// Auto-update settings will be configured in app.whenReady()

// Auto-update event handlers
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...')
  win?.webContents.send('update-checking')
})

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info)
  win?.webContents.send('update-available', info)
})

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available:', info)
  win?.webContents.send('update-not-available', info)
})

autoUpdater.on('download-progress', (progressObj) => {
  log.info('Download progress:', progressObj)
  win?.webContents.send('download-progress', progressObj)
})

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info)
  win?.webContents.send('update-downloaded', info)
})

autoUpdater.on('error', (err) => {
  log.error('Update error:', err)
  win?.webContents.send('update-error', err.message)
})

// IPC handlers for auto-update
ipcMain.on('check-for-updates', () => {
  if (!VITE_DEV_SERVER_URL) {
    autoUpdater.checkForUpdates()
  } else {
    log.info('Skipping update check in development mode')
  }
})

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate()
})

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall()
})

app.whenReady().then(() => {
  // Configure logging for auto-updater (must be done after app is ready)
  // Check if log.transports.file exists before configuring
  if (log.transports && log.transports.file) {
    log.transports.file.level = 'info'
  }
  autoUpdater.logger = log

  // Auto-update settings
  autoUpdater.autoDownload = false // Let user choose to download
  autoUpdater.autoInstallOnAppQuit = true // Install when app quits

  createWindow()

  // Check for updates on startup (production only)
  if (!VITE_DEV_SERVER_URL) {
    setTimeout(() => {
      log.info('Checking for updates on startup...')
      autoUpdater.checkForUpdates()
    }, 3000) // Wait 3 seconds after app starts
  }
})
