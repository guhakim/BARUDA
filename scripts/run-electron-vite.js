// Some parent shells (VSCode's integrated terminal / extension host, in
// particular) export ELECTRON_RUN_AS_NODE=1 to child processes. Electron
// checks that var on startup and runs as a plain Node process instead of
// launching a GUI app, so any window creation silently no-ops. Setting the
// key to `undefined` here removes it from the child's environment (Node
// drops undefined-valued keys when building the child's envp), independent
// of the host OS or shell.
const { spawn } = require('node:child_process')
const path = require('node:path')

const mode = process.argv[2] // 'dev' | 'preview'
const electronVitePkg = require.resolve('electron-vite/package.json')
const electronViteBin = path.join(path.dirname(electronVitePkg), 'bin/electron-vite.js')

const child = spawn(process.execPath, [electronViteBin, mode], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined }
})

child.on('exit', (code) => process.exit(code ?? 0))
