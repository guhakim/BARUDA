declare global {
  interface Window {
    overlayAPI: {
      onBlurChange: (callback: (level: number) => void) => void
      onSnapshot: (callback: (dataUrl: string) => void) => void
    }
  }
}

export {}
