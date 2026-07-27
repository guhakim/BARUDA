import { contextBridge, ipcRenderer } from 'electron'

const overlayAPI = {
  onBlurChange: (callback: (level: number) => void): void => {
    ipcRenderer.on('overlay:blur', (_event, level: number) => callback(level))
  },
  onSnapshot: (callback: (dataUrl: string) => void): void => {
    ipcRenderer.on('overlay:snapshot', (_event, dataUrl: string) => callback(dataUrl))
  }
}

contextBridge.exposeInMainWorld('overlayAPI', overlayAPI)
