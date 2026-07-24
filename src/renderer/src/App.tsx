import { useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const [blur, setBlur] = useState(0)
  const handleBlurChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const level = Number(event.target.value)
    setBlur(level)
    window.electron.ipcRenderer.send('overlay:set-blur', level)
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <label htmlFor="blur-test">Overlay blur test: {blur}px</label>
        <br />
        <input
          id="blur-test"
          type="range"
          min={0}
          max={15}
          step={1}
          value={blur}
          onChange={handleBlurChange}
        />
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
