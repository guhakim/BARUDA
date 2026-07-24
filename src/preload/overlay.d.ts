declare global {
  interface Window {
    overlayAPI: {
      onBlurChange: (callback: (level: number) => void) => void
    }
  }
}

export {}
