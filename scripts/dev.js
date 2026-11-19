import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vite = path.join(root, 'node_modules/vite/bin/vite.js')
const api = path.join(root, 'server/index.js')

const children = [
  spawn(process.execPath, [vite], { cwd: root, stdio: 'inherit' }),
  spawn(process.execPath, ['--watch', api], { cwd: root, stdio: 'inherit' }),
]

let stopping = false
function stop(signal = 'SIGTERM') {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill(signal)
}

process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))

for (const child of children) {
  child.on('exit', (code) => {
    if (stopping) return
    stop()
    process.exitCode = code ?? 1
  })
}
