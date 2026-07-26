import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createOverlayWindows, setOverlayBlur } from './overlayWindow'
import {
  createMiniBarWindow,
  showMiniBar,
  hideMiniBar,
  setMiniBarGoodness,
  moveMiniBarBy
} from './miniBarWindow'
import { getRecentPostureLogs, recordPostureSample } from './postureStore'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Keeps the window above other apps even after it loses focus (e.g. the
  // user clicks elsewhere), since this is a small always-visible companion
  // window rather than a normal document window.
  mainWindow.setAlwaysOnTop(true, 'floating')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Swaps the full camera window for a slim bottom-of-screen bar, so the
  // webcam feed isn't on screen when someone else is around, while posture
  // status stays visible at a glance. Triggered by an in-app icon button
  // (not the native yellow minimize button — hijacking that event on an
  // always-on-top window previously left it stuck in native fullscreen).
  ipcMain.on('minibar:show', () => {
    mainWindow.hide()
    showMiniBar()
  })

  ipcMain.on('minibar:move', (_event, dx: number, dy: number) => moveMiniBarBy(dx, dy))

  ipcMain.on('minibar:restore', () => {
    hideMiniBar()
    mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('overlay:set-blur', (_event, level: number) => setOverlayBlur(level))

  ipcMain.on('posture:report', (_event, payload: { score: number; timestamp: number }) => {
    recordPostureSample(payload.score, payload.timestamp)
    setMiniBarGoodness(100 - payload.score)
  })

  ipcMain.handle('posture:get-logs', () => getRecentPostureLogs())

  createOverlayWindows()
  createMiniBarWindow()
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
