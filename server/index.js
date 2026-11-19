import http from 'node:http'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from './env.js'
import {
  addMessage,
  deleteMessage,
  listMessages,
  markMessageRead,
} from './store.js'

const env = loadEnv()
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const port = Number(env.PORT || 3001)

const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'admin123'
const demoMode = !env.ADMIN_PASSWORD || env.ADMIN_PASSWORD === 'admin123'
const TOKEN_TTL = 24 * 60 * 60 * 1000
const tokens = new Map()

function issueToken() {
  const token = crypto.randomUUID()
  tokens.set(token, Date.now() + TOKEN_TTL)
  return token
}

function isAuthorized(request) {
  const header = request.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const expires = tokens.get(token)
  if (!expires) return false
  if (Date.now() > expires) {
    tokens.delete(token)
    return false
  }
  return true
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(body)
}

async function readBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 100_000) throw new Error('Request body is too large.')
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  const text = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON body.')
  }
}

function validateContact(body) {
  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim()
  const message = String(body?.message ?? '').trim()
  const errors = []

  if (!name || name.length > 100) {
    errors.push('Please enter a name (100 characters maximum).')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    errors.push('Please enter a valid email address.')
  }
  if (!message || message.length > 5000) {
    errors.push('Please enter a message (5000 characters maximum).')
  }

  return { errors, value: { name, email, message } }
}

// Demo mode: messages are stored locally and shown in the admin inbox.
// To enable real email later, send through a provider here (e.g. Resend)
// using environment variables and return { sent: true } on success.
async function deliverEmail() {
  return { sent: false, reason: 'demo' }
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
}

function serveStatic(request, response, pathname) {
  const requested = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  let file = path.join(dist, requested)

  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    // SPA fallback so /admin loads the React app.
    file = path.join(dist, 'index.html')
  }
  if (!fs.existsSync(file)) {
    sendJson(response, 404, { error: 'Build the app first with npm run build.' })
    return
  }

  response.writeHead(200, {
    'Content-Type': contentTypes[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  })
  fs.createReadStream(file).pipe(response)
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
  const { pathname } = url

  try {
    if (pathname === '/api/health' && request.method === 'GET') {
      sendJson(response, 200, { ok: true })
      return
    }

    if (pathname === '/api/config' && request.method === 'GET') {
      sendJson(response, 200, { demo: demoMode, emailEnabled: false })
      return
    }

    if (pathname === '/api/contact' && request.method === 'POST') {
      const body = await readBody(request)
      const { errors, value } = validateContact(body)
      if (errors.length) {
        sendJson(response, 400, { error: errors.join(' ') })
        return
      }

      const message = {
        id: crypto.randomUUID(),
        ...value,
        createdAt: new Date().toISOString(),
        read: false,
      }
      await addMessage(message)
      const delivery = await deliverEmail(message)
      sendJson(response, 201, {
        ok: true,
        id: message.id,
        emailSent: delivery.sent,
        demo: !delivery.sent,
      })
      return
    }

    if (pathname === '/api/admin/login' && request.method === 'POST') {
      const body = await readBody(request)
      if (String(body?.password ?? '') !== ADMIN_PASSWORD) {
        sendJson(response, 401, { error: 'Incorrect password.' })
        return
      }
      sendJson(response, 200, { token: issueToken(), demo: demoMode })
      return
    }

    if (pathname.startsWith('/api/admin/')) {
      if (!isAuthorized(request)) {
        sendJson(response, 401, { error: 'Please sign in again.' })
        return
      }

      if (pathname === '/api/admin/messages' && request.method === 'GET') {
        const messages = await listMessages()
        sendJson(response, 200, {
          messages,
          stats: {
            total: messages.length,
            unread: messages.filter((item) => !item.read).length,
            read: messages.filter((item) => item.read).length,
          },
        })
        return
      }

      const match = pathname.match(/^\/api\/admin\/messages\/([^/]+)$/)
      if (match) {
        const id = decodeURIComponent(match[1])
        if (request.method === 'PATCH') {
          const updated = await markMessageRead(id)
          if (!updated) {
            sendJson(response, 404, { error: 'Message not found.' })
            return
          }
          sendJson(response, 200, { message: updated })
          return
        }
        if (request.method === 'DELETE') {
          const removed = await deleteMessage(id)
          if (!removed) {
            sendJson(response, 404, { error: 'Message not found.' })
            return
          }
          sendJson(response, 200, { ok: true })
          return
        }
      }

      sendJson(response, 404, { error: 'Unknown admin endpoint.' })
      return
    }

    if (pathname.startsWith('/api/')) {
      sendJson(response, 404, { error: 'Unknown endpoint.' })
      return
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      serveStatic(request, response, pathname)
      return
    }

    sendJson(response, 405, { error: 'Method not allowed.' })
  } catch (error) {
    sendJson(response, 400, { error: error.message || 'Request failed.' })
  }
})

server.listen(port, () => {
  console.log(`API server ready at http://localhost:${port}`)
  console.log(`Demo mode: ${demoMode ? 'on (messages stored locally)' : 'off'}`)
})
