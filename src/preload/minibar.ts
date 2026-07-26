import { contextBridge, ipcRenderer } from 'electron'

const minibarAPI = {
  onGoodness: (callback: (goodness: number) => void): void => {
    ipcRenderer.on('minibar:goodness', (_event, goodness: number) => callback(goodness))
  },
  restore: (): void => {
    ipcRenderer.send('minibar:restore')
  }
}

contextBridge.exposeInMainWorld('minibarAPI', minibarAPI)
