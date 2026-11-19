import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(here, 'data')
const dataFile = path.join(dataDir, 'messages.json')

// Serialize writes so concurrent form submissions cannot overwrite each other.
let queue = Promise.resolve()
function withLock(task) {
  const result = queue.then(task, task)
  queue = result.catch(() => {})
  return result
}

async function readAll() {
  try {
    const raw = await fs.readFile(dataFile, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function writeAll(messages) {
  await fs.mkdir(dataDir, { recursive: true })
  const temporary = `${dataFile}.tmp`
  await fs.writeFile(temporary, JSON.stringify(messages, null, 2), 'utf8')
  await fs.rename(temporary, dataFile)
}

function newestFirst(messages) {
  return [...messages].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )
}

export function addMessage(message) {
  return withLock(async () => {
    const messages = await readAll()
    messages.push(message)
    await writeAll(messages)
    return message
  })
}

export async function listMessages() {
  return newestFirst(await readAll())
}

export function markMessageRead(id) {
  return withLock(async () => {
    const messages = await readAll()
    const message = messages.find((item) => item.id === id)
    if (!message) return null
    message.read = true
    message.readAt = new Date().toISOString()
    await writeAll(messages)
    return message
  })
}

export function deleteMessage(id) {
  return withLock(async () => {
    const messages = await readAll()
    const remaining = messages.filter((item) => item.id !== id)
    if (remaining.length === messages.length) return false
    await writeAll(remaining)
    return true
  })
}
