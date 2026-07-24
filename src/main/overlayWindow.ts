import { BrowserWindow, screen, Display } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const overlayWindows = new Map<number, BrowserWindow>()

function createOverlayForDisplay(display: Display): BrowserWindow {
  const overlay = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    transparent: true,
    frame: false,
    hasShadow: false,
    show: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/overlay.js'),
      sandbox: false
    }
  })

  // Float above fullscreen apps and all Spaces/virtual desktops, and never
  // accept clicks/keyboard focus so it never blocks the app underneath.
  overlay.setAlwaysOnTop(true, 'screen-saver')
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  overlay.setIgnoreMouseEvents(true, { forward: true })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlay.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay.html`)
  } else {
    overlay.loadFile(join(__dirname, '../renderer/overlay.html'))
  }

  overlay.once('ready-to-show', () => overlay.showInactive())

  return overlay
}

function syncOverlaysToDisplays(): void {
  const displays = screen.getAllDisplays()
  const currentIds = new Set(displays.map((d) => d.id))

  for (const [id, win] of overlayWindows) {
    if (!currentIds.has(id)) {
      win.destroy()
      overlayWindows.delete(id)
    }
  }

  for (const display of displays) {
    const existing = overlayWindows.get(display.id)
    if (existing) {
      existing.setBounds(display.bounds)
    } else {
      overlayWindows.set(display.id, createOverlayForDisplay(display))
    }
  }
}

export function createOverlayWindows(): void {
  syncOverlaysToDisplays()
  screen.on('display-added', syncOverlaysToDisplays)
  screen.on('display-removed', syncOverlaysToDisplays)
  screen.on('display-metrics-changed', syncOverlaysToDisplays)
}

export function setOverlayBlur(level: number): void {
  for (const win of overlayWindows.values()) {
    win.webContents.send('overlay:blur', level)
  }
}
