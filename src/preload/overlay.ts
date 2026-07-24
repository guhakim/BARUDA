import { contextBridge, ipcRenderer } from 'electron'

const overlayAPI = {
  onBlurChange: (callback: (level: number) => void): void => {
    ipcRenderer.on('overlay:blur', (_event, level: number) => callback(level))
  }
}

contextBridge.exposeInMainWorld('overlayAPI', overlayAPI)
