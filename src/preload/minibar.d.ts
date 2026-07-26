declare global {
  interface Window {
    minibarAPI: {
      onGoodness: (callback: (goodness: number) => void) => void
      restore: () => void
      moveBy: (dx: number, dy: number) => void
    }
  }
}

export {}
