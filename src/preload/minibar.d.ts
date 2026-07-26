declare global {
  interface Window {
    minibarAPI: {
      onGoodness: (callback: (goodness: number) => void) => void
      restore: () => void
    }
  }
}

export {}
