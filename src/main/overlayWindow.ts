import { BrowserWindow, screen, Display, desktopCapturer } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const overlayWindows = new Map<number, BrowserWindow>()
const lastBlurLevel = new Map<number, number>()

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

// backdrop-filter on a transparent BrowserWindow only blurs the window's own
// (empty) DOM content, not the desktop behind it — Chromium has no access to
// pixels other processes drew. So instead we snapshot the display the moment
// blur starts (rising edge from 0) and blur that static image with a CSS
// filter, swapping it back out once posture recovers.
async function captureDisplaySnapshot(display: Display): Promise<string | null> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(display.bounds.width / display.scaleFactor / 2),
        height: Math.round(display.bounds.height / display.scaleFactor / 2)
      }
    })
    const source =
      sources.find((s) => s.display_id === String(display.id)) ?? sources[0] ?? null
    if (!source || source.thumbnail.isEmpty()) return null
    return source.thumbnail.toDataURL()
  } catch (err) {
    console.error('Failed to capture display for overlay blur:', err)
    return null
  }
}

export async function setOverlayBlur(level: number): Promise<void> {
  const displays = screen.getAllDisplays()

  for (const [id, win] of overlayWindows) {
    const previousLevel = lastBlurLevel.get(id) ?? 0
    if (level > 0 && previousLevel === 0) {
      const display = displays.find((d) => d.id === id)
      if (display) {
        const snapshot = await captureDisplaySnapshot(display)
        if (snapshot) win.webContents.send('overlay:snapshot', snapshot)
      }
    }
    lastBlurLevel.set(id, level)
    win.webContents.send('overlay:blur', level)
  }
}
