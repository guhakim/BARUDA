import { contextBridge, ipcRenderer } from 'electron'

const minibarAPI = {
  onGoodness: (callback: (goodness: number) => void): void => {
    ipcRenderer.on('minibar:goodness', (_event, goodness: number) => callback(goodness))
  },
  restore: (): void => {
    ipcRenderer.send('minibar:restore')
  },
  moveBy: (dx: number, dy: number): void => {
    ipcRenderer.send('minibar:move', dx, dy)
  }
}

contextBridge.exposeInMainWorld('minibarAPI', minibarAPI)
