import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Check, Inbox, LogOut, Mail,
  RefreshCw, ShieldCheck, Trash2,
} from 'lucide-react'

const TOKEN_KEY = 'creative-studio-admin-token'

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [demo, setDemo] = useState(false)
  const [messages, setMessages] = useState([])
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 })
  const [loading, setLoading] = useState(false)

  const request = useCallback(async (path, options = {}, activeToken = token) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        ...options.headers,
      },
    })
    return parseResponse(response)
  }, [token])

  const loadMessages = useCallback(async (activeToken = token) => {
    if (!activeToken) return
    setLoading(true)
    setError('')
    try {
      const data = await request('/api/admin/messages', {}, activeToken)
      setMessages(data.messages)
      setStats(data.stats)
    } catch (err) {
      if (err.message === 'Please sign in again.') {
        sessionStorage.removeItem(TOKEN_KEY)
        setToken('')
        setMessages([])
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [request, token])

  useEffect(() => {
    let ignore = false
    fetch('/api/config')
      .then((response) => response.json())
      .then((data) => { if (!ignore) setDemo(!!data.demo) })
      .catch(() => {})
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    if (!token) return undefined
    let ignore = false
    Promise.resolve().then(() => {
      if (!ignore) loadMessages(token)
    })
    return () => { ignore = true }
  }, [token, loadMessages])

  async function signIn(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await request(
        '/api/admin/login',
        { method: 'POST', body: JSON.stringify({ password }) },
        ''
      )
      sessionStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setPassword('')
    setMessages([])
    setError('')
  }

  async function markRead(id) {
    try {
      await request(`/api/admin/messages/${encodeURIComponent(id)}`, { method: 'PATCH' })
      await loadMessages()
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this message permanently?')) return
    try {
      await request(`/api/admin/messages/${encodeURIComponent(id)}`, { method: 'DELETE' })
      await loadMessages()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f7f2ed] text-[#33251e] flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <a href="/" className="inline-flex items-center gap-2 text-sm text-[#a47a56] font-semibold mb-8">
            <ArrowLeft size={16} /> Back to website
          </a>

          <div className="bg-white rounded-3xl shadow-xl p-9">
            <div className="w-14 h-14 rounded-2xl bg-[#eee5dc] text-[#a47a56] flex items-center justify-center">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-3xl font-bold mt-6">Admin Inbox</h1>
            <p className="text-gray-500 mt-2">
              Sign in to view messages from the contact form.
            </p>

            {demo && (
              <p className="mt-5 rounded-xl bg-[#fdf6ef] border border-[#e8d6c4] text-sm text-[#7b5c44] p-4">
                Demo mode is on. The password is <strong>admin123</strong>.
                Change <code>ADMIN_PASSWORD</code> in <code>.env</code> to secure this page.
              </p>
            )}

            <form onSubmit={signIn} className="mt-7">
              <label className="block font-semibold mb-2" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-[#b28b68]"
              />
              {error && (
                <p role="alert" className="text-red-700 text-sm mt-3">{error}</p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full mt-6 bg-[#30231d] text-white p-4 rounded-xl font-semibold hover:bg-[#604637] disabled:opacity-60"
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f2ed] text-[#33251e]">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-[#eadfd5] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#493326] text-white flex items-center justify-center font-bold">
              A
            </span>
            <div>
              <p className="font-bold leading-tight">Admin Inbox</p>
              <p className="text-xs text-gray-500">Creative Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm hover:bg-[#f1e7df]"
            >
              <ArrowLeft size={16} /> View site
            </a>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-[#30231d] text-white hover:bg-[#604637]"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[#a47a56] uppercase tracking-widest text-sm">
              Contact submissions
            </p>
            <h1 className="text-4xl font-bold mt-3">Messages</h1>
          </div>
          <button
            type="button"
            onClick={() => loadMessages()}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white border border-[#eadfd5] px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#f1e7df] disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {demo && (
          <p className="mt-8 rounded-2xl bg-[#fdf6ef] border border-[#e8d6c4] text-sm text-[#7b5c44] p-5">
            <strong>Demo mode:</strong> messages are saved to
            <code> server/data/messages.json </code>
            and shown here. No email is sent yet.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-8 rounded-2xl bg-red-50 border border-red-200 text-red-700 p-5">
            {error}
          </p>
        )}

        <div className="grid sm:grid-cols-3 gap-5 mt-8">
          {[
            ['Total messages', stats.total, Inbox],
            ['Unread', stats.unread, Mail],
            ['Read', stats.read, Check],
          ].map(([label, value, Icon]) => (
            <div key={label} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{label}</p>
                <Icon size={18} className="text-[#a47a56]" />
              </div>
              <p className="text-3xl font-bold mt-3">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-5">
          {messages.length === 0 && !loading && (
            <div className="bg-white rounded-2xl shadow-sm p-14 text-center">
              <Inbox size={40} className="text-[#c9b6a5] mx-auto" />
              <p className="font-semibold text-lg mt-5">No messages yet</p>
              <p className="text-gray-500 mt-2">
                Submissions from the contact form will appear here.
              </p>
              <a href="/" className="inline-block mt-6 text-[#a47a56] font-semibold">
                Open the website →
              </a>
            </div>
          )}

          {messages.map((message) => (
            <motion.article
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl shadow-sm p-7 border-l-4 ${
                message.read ? 'border-transparent' : 'border-[#a47a56]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">{message.name}</h2>
                    {!message.read && (
                      <span className="text-xs font-semibold bg-[#eee5dc] text-[#8a6244] px-3 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <a
                    href={`mailto:${message.email}`}
                    className="text-sm text-[#a47a56] hover:underline break-all"
                  >
                    {message.email}
                  </a>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(message.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!message.read && (
                    <button
                      type="button"
                      onClick={() => markRead(message.id)}
                      className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-[#eee5dc] text-[#6f4f38] hover:bg-[#e3d3c4]"
                    >
                      <Check size={15} /> Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(message.id)}
                    aria-label={`Delete message from ${message.name}`}
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
              <p className="text-gray-700 leading-8 mt-5 whitespace-pre-wrap">
                {message.message}
              </p>
              <p className="text-xs text-gray-300 mt-5 font-mono break-all">
                Ref: {message.id}
              </p>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  )
}
