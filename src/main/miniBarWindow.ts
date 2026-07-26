import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const BAR_HEIGHT = 56

let miniBarWindow: BrowserWindow | null = null

// A slim, always-on-top strip docked to the bottom of the primary display —
// a low-attention stand-in for the full camera window while someone else is
// around, so posture status is still visible without the webcam feed on
// screen. Mirrors the main screen's "자세" health bar: same continuous
// red-to-green gradient and percentage readout, just docked to the bottom.
export function createMiniBarWindow(): BrowserWindow {
  const display = screen.getPrimaryDisplay()

  miniBarWindow = new BrowserWindow({
    x: display.workArea.x,
    y: display.workArea.y + display.workArea.height - BAR_HEIGHT,
    width: display.workArea.width,
    height: BAR_HEIGHT,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/minibar.js'),
      sandbox: false
    }
  })

  miniBarWindow.setAlwaysOnTop(true, 'floating')
  miniBarWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    miniBarWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/minibar.html`)
  } else {
    miniBarWindow.loadFile(join(__dirname, '../renderer/minibar.html'))
  }

  return miniBarWindow
}

export function showMiniBar(): void {
  miniBarWindow?.showInactive()
}

export function hideMiniBar(): void {
  miniBarWindow?.hide()
}

export function setMiniBarGoodness(goodness: number): void {
  miniBarWindow?.webContents.send('minibar:goodness', goodness)
}

// Moves the bar by a mouse-drag delta reported from the renderer, instead
// of using BrowserWindow's native `movable`. A movable, transparent,
// full-width always-on-top window turned out to interfere with the main
// window's visibility on macOS (it would silently fail to show on launch),
// so dragging is done by hand: track the pointer in the renderer and
// reposition the window frame-by-frame here.
export function moveMiniBarBy(dx: number, dy: number): void {
  if (!miniBarWindow) return
  const [x, y] = miniBarWindow.getPosition()
  miniBarWindow.setPosition(Math.round(x + dx), Math.round(y + dy))
}
