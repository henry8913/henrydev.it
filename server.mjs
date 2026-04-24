import http from 'node:http'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import handler from './api/chat.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distDir = path.join(__dirname, 'dist')
const port = Number.parseInt(process.env.PORT || '3000', 10)
const CANONICAL_HOST = 'henrydev.it'
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

function headerValue(v) {
  if (Array.isArray(v)) return v[0] || ''
  return typeof v === 'string' ? v : ''
}

function firstForwardedValue(v) {
  return String(v || '')
    .split(',')[0]
    .trim()
}

function getRequestHost(req) {
  const xfHost = headerValue(req.headers['x-forwarded-host'])
  const host = xfHost ? firstForwardedValue(xfHost) : headerValue(req.headers.host)
  return String(host || '').trim()
}

function getRequestProto(req) {
  const xfProto = headerValue(req.headers['x-forwarded-proto'])
  const proto = xfProto ? firstForwardedValue(xfProto) : ''
  return (proto || 'http').trim()
}

function maybeRedirectToCanonical(req, res) {
  const host = getRequestHost(req).toLowerCase()
  if (!host) return false
  if (host !== CANONICAL_HOST && host !== `www.${CANONICAL_HOST}`) return false

  const proto = getRequestProto(req).toLowerCase()
  const needsHttps = proto !== 'https'
  const needsNoWww = host !== CANONICAL_HOST

  if (!needsHttps && !needsNoWww) return false

  const url = req.url || '/'
  res.statusCode = 308
  res.setHeader('Location', `${CANONICAL_ORIGIN}${url}`)
  res.end()
  return true
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath)
  const cleaned = decoded.split('?')[0].split('#')[0]
  const withoutLeadingSlash = cleaned.replace(/^\/+/, '')
  const resolved = path.resolve(root, withoutLeadingSlash)
  if (!resolved.startsWith(path.resolve(root))) return null
  return resolved
}

async function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const type = contentTypes[ext] || 'application/octet-stream'
  const data = await fs.readFile(filePath)
  res.statusCode = 200
  res.setHeader('Content-Type', type)
  res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable')
  res.end(data)
}

async function serveIndex(res) {
  await serveFile(res, path.join(distDir, 'index.html'))
}

const server = http.createServer(async (req, res) => {
  try {
    if (maybeRedirectToCanonical(req, res)) return

    const method = req.method || 'GET'
    const url = req.url || '/'
    const pathname = url.split('?')[0] || '/'

    if (pathname === '/api/chat') {
      await handler(req, res)
      return
    }

    if (pathname.startsWith('/api/')) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Not Found' }))
      return
    }

    const candidate = pathname === '/' ? path.join(distDir, 'index.html') : safeJoin(distDir, pathname)
    if (!candidate) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Bad Request')
      return
    }

    const stat = await fs.stat(candidate).catch(() => null)
    if (stat?.isFile()) {
      await serveFile(res, candidate)
      return
    }

    const accept = String(req.headers.accept || '')
    if (method === 'GET' && accept.includes('text/html')) {
      await serveIndex(res)
      return
    }

    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Not Found')
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    }
    res.end('Internal Server Error')
  }
})

server.listen(port, '0.0.0.0')
