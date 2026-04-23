import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

type ChatRole = 'user' | 'assistant'
type ChatReqBody = {
  messages?: { role: ChatRole; content: string }[]
  context?: string
}

type OpenRouterChatCompletion = {
  choices?: { message?: { content?: string } }[]
  error?: { message?: string }
  message?: string
}

const RESUME_PDF_NAME = 'Henry G. | Full Stack Developer.pdf'
const RESUME_MAX_CHARS = 20_000
const GITHUB_MAX_CHARS = 12_000
const GITHUB_MAX_REPOS = 30

let resumeCache: { etag: string | null; lastModified: string | null; text: string | null } = {
  etag: null,
  lastModified: null,
  text: null,
}

let githubCache: { etag: string | null; lastModified: string | null; text: string | null } = {
  etag: null,
  lastModified: null,
  text: null,
}

let githubMetaCache: { etag: string | null; lastModified: string | null; publicRepos: number | null } = {
  etag: null,
  lastModified: null,
  publicRepos: null,
}

function headerValue(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0] || ''
  return typeof v === 'string' ? v : ''
}

function getBaseUrl(req: IncomingMessage) {
  const proto = headerValue(req.headers['x-forwarded-proto']) || 'http'
  const host = headerValue(req.headers['x-forwarded-host']) || headerValue(req.headers.host)
  if (!host) return ''
  return `${proto}://${host}`
}

async function extractPdfText(data: Uint8Array) {
  type PdfTextContent = { items: unknown[] }
  type PdfPageProxy = { getTextContent: () => Promise<PdfTextContent> }
  type PdfDocumentProxy = { numPages: number; getPage: (pageNumber: number) => Promise<PdfPageProxy> }
  type PdfLoadingTask = { promise: Promise<PdfDocumentProxy> }
  type GetDocumentFn = (opts: { data: Uint8Array; disableWorker: boolean }) => PdfLoadingTask

  const mod = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as { getDocument: GetDocumentFn }
  const loadingTask = mod.getDocument({ data, disableWorker: true })
  const pdf = await loadingTask.promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const items = Array.isArray(content.items) ? content.items : []
    const text = items
      .map((it) => {
        if (typeof it !== 'object' || it === null) return ''
        const str = (it as { str?: unknown }).str
        return typeof str === 'string' ? str : ''
      })
      .filter((s) => s.length > 0)
      .join(' ')
    pages.push(text)
  }
  return pages.join('\n\n')
}

function normalizeText(text: string) {
  return String(text)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n\n[...troncato]`
}

type GitHubRepo = {
  name?: unknown
  description?: unknown
  language?: unknown
  stargazers_count?: unknown
  html_url?: unknown
  topics?: unknown
  fork?: unknown
}

function formatRepoLine(repo: GitHubRepo) {
  const name = typeof repo.name === 'string' ? repo.name : ''
  const desc = typeof repo.description === 'string' ? repo.description : ''
  const lang = typeof repo.language === 'string' ? repo.language : ''
  const stars = typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0
  const url = typeof repo.html_url === 'string' ? repo.html_url : ''
  const topics = Array.isArray(repo.topics) ? repo.topics.filter((t) => typeof t === 'string').slice(0, 6) : []

  if (!name) return ''
  const meta = [lang ? `lang: ${lang}` : null, stars ? `⭐ ${stars}` : null, topics.length ? `topics: ${topics.join(', ')}` : null]
    .filter(Boolean)
    .join(' · ')
  const parts = [`- ${name}`, desc ? `— ${desc}` : null, meta ? `(${meta})` : null, url ? `→ ${url}` : null].filter(Boolean)
  return parts.join(' ')
}

async function getGitHubPublicRepoCount(username: string, token: string) {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}`

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  if (githubMetaCache.etag) headers['if-none-match'] = githubMetaCache.etag
  if (githubMetaCache.lastModified) headers['if-modified-since'] = githubMetaCache.lastModified

  const resp = await fetch(url, { headers })
  if (resp.status === 304 && typeof githubMetaCache.publicRepos === 'number') return githubMetaCache.publicRepos
  if (!resp.ok) return null

  const data = (await resp.json().catch(() => null)) as unknown
  const publicReposRaw =
    data && typeof data === 'object' ? (data as { public_repos?: unknown }).public_repos : undefined
  const publicRepos = typeof publicReposRaw === 'number' ? publicReposRaw : null

  githubMetaCache = {
    etag: resp.headers.get('etag'),
    lastModified: resp.headers.get('last-modified'),
    publicRepos,
  }

  return publicRepos
}

async function getGitHubContext(username: string, token: string) {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`
  const publicReposTotal = await getGitHubPublicRepoCount(username, token).catch(() => null)

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  if (githubCache.etag) headers['if-none-match'] = githubCache.etag
  if (githubCache.lastModified) headers['if-modified-since'] = githubCache.lastModified

  const resp = await fetch(url, { headers })
  if (resp.status === 304 && githubCache.text) return githubCache.text
  if (!resp.ok) return ''

  const data = (await resp.json().catch(() => null)) as unknown
  if (!Array.isArray(data)) return ''

  const repos = (data as GitHubRepo[])
    .filter((r) => r && typeof r === 'object' && r.fork !== true)
    .slice(0, 100)
    .map((r) => formatRepoLine(r))
    .filter((s) => s.length > 0)
    .slice(0, GITHUB_MAX_REPOS)

  const text = truncateText(
    normalizeText([
      `GitHub: public_repos_total=${publicReposTotal ?? 'unknown'} · repos_in_context=${repos.length} · forks_excluded=true · sort=pushed`,
      '',
      'Repo (subset):',
      ...repos,
    ].join('\n')),
    GITHUB_MAX_CHARS,
  )

  githubCache = {
    etag: resp.headers.get('etag'),
    lastModified: resp.headers.get('last-modified'),
    text,
  }

  return text
}

async function getResumePdfText(baseUrl: string) {
  if (!baseUrl) return ''

  const pdfUrl = `${baseUrl}/${encodeURIComponent(RESUME_PDF_NAME)}`
  const headers: Record<string, string> = {}
  if (resumeCache.etag) headers['if-none-match'] = resumeCache.etag
  if (resumeCache.lastModified) headers['if-modified-since'] = resumeCache.lastModified

  const resp = await fetch(pdfUrl, { headers })
  if (resp.status === 304 && resumeCache.text) return resumeCache.text
  if (!resp.ok) return ''

  const buf = await resp.arrayBuffer()
  const raw = await extractPdfText(new Uint8Array(buf))
  const normalized = truncateText(normalizeText(raw), RESUME_MAX_CHARS)

  resumeCache = {
    etag: resp.headers.get('etag'),
    lastModified: resp.headers.get('last-modified'),
    text: normalized,
  }

  return normalized
}

function readJson(req: IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += String(chunk)
      if (data.length > 2_000_000) reject(new Error('Payload too large'))
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function parseOpenRouterResponse(text: string): OpenRouterChatCompletion | null {
  try {
    const data: unknown = JSON.parse(text)
    if (typeof data !== 'object' || data === null) return null
    return data as OpenRouterChatCompletion
  } catch {
    return null
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'henryai-openrouter-dev-api',
        configureServer(server) {
          server.middlewares.use('/api/chat', async (req: IncomingMessage, res: ServerResponse) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Method Not Allowed' }))
              return
            }

            const apiKey = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY
            if (!apiKey) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Server misconfigured: missing OPENROUTER_API_KEY' }))
              return
            }

            try {
              const body = (await readJson(req)) as ChatReqBody
              const messages = Array.isArray(body?.messages) ? body.messages : null
              const context = typeof body?.context === 'string' ? body.context : ''

              if (!messages || messages.length === 0) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Missing messages' }))
                return
              }

              const model = env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
              const baseUrl = getBaseUrl(req)
              const resumeText = await getResumePdfText(baseUrl).catch(() => '')
              const githubUsername = env.GITHUB_USERNAME || process.env.GITHUB_USERNAME || 'henry8913'
              const githubToken = env.GITHUB_TOKEN || process.env.GITHUB_TOKEN || ''
              const githubText = await getGitHubContext(githubUsername, githubToken).catch(() => '')
              const system = [
                "Sei HenryAI, il copilota del portfolio personale di Henry Grecchi.",
                "Rispondi in modo utile e conciso. Usa come fonte primaria il contesto (sito, CV, GitHub) e la conversazione.",
                "Quando dai informazioni personali o fattuali, indica la fonte in modo breve: (Dal sito), (Dal CV), (Da GitHub).",
                "Quando stai rispondendo in modo generale/non verificabile, dillo esplicitamente: (In generale) o (Opinione generale).",
                "Prima di rispondere, combina SEMPRE tutte le fonti disponibili insieme (Contesto sito + CV + GitHub + conversazione). Se una fonte è più completa, preferiscila. Evita ripetizioni: riassumi e non dire la stessa cosa due volte.",
                "Se una domanda esce dal contesto (es. passioni fuori dalla programmazione, soft skills, approccio al lavoro, consigli), puoi rispondere in modo generale e ragionevole, ma senza inventare dettagli personali specifici.",
                "Se una domanda richiede un dettaglio personale non presente nel contesto, dillo chiaramente e invita a contattarmi per conferma.",
                "Scrivi in prima persona, come se fossi Henry (usa 'io', 'il mio', 'ho fatto').",
                "Non fingere di essere Henry in carne e ossa: se l'utente chiede conferme personali o dettagli non presenti nel contesto, spiega che sei un assistente e invita a contattarlo.",
                "Tono: professionale, chiaro e cordiale. Considera che possono scrivere recruiter/HR, manager, clienti, collaboratori, amici o persone interessate a proposte di lavoro.",
                "Stile: niente slang, niente emoji, niente eccessi; risposte brevi ma complete, con punti elenco quando aiuta.",
                "Se l'utente chiede una proposta/collaborazione, rispondi in modo orientato all'azione: disponibilità, ambiti, e invito a contattarmi con i dettagli (sezione Contact / email).",
                "Su ruoli e opportunità: mantieniti aperto. Se non c'è un vincolo esplicito nel contesto, evita risposte troppo chiuse; esprimi preferenze generali e invita a contattarmi con i dettagli dell'opportunità.",
                "Puoi parlare anche di tecnologia in generale (web, software, AI): resta curioso, umile, pragmatico e aperto alle opportunità e all'apprendimento continuo.",
                "Puoi parlare anche di argomenti fuori dalla tecnologia: resta rispettoso e non polarizzante. Evita di inventare dettagli personali; se non sono nel contesto, dillo e invita a contattarmi.",
                "Se un dettaglio non è presente nel contesto, dillo chiaramente e suggerisci dove trovarlo nel sito (es. About, Portfolio, Resume, Contact).",
                "Quando mancano dettagli utili, chiudi proponendo di contattarmi (sezione Contact / email) per conferma o approfondimenti.",
                "Se l'utente scrive in inglese, rispondi in inglese. Altrimenti rispondi in italiano.",
                '',
                'Contesto sito:',
                context || '(nessun contesto)',
                '',
                'Contesto CV (PDF):',
                resumeText || '(non disponibile)',
                '',
                'Contesto GitHub:',
                githubText || '(non disponibile)',
              ].join('\n')

              const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'http://localhost:5173',
                  'X-Title': 'henrydev.it (dev)',
                },
                body: JSON.stringify({
                  model,
                  temperature: 0.4,
                  max_tokens: 650,
                  messages: [{ role: 'system', content: system }, ...messages],
                }),
              })

              const raw = await upstream.text()
              const data = parseOpenRouterResponse(raw)

              if (!upstream.ok) {
                const errMsg = data?.error?.message || data?.message || `Upstream error (${upstream.status})`
                res.statusCode = 502
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: errMsg }))
                return
              }

              const content = data?.choices?.[0]?.message?.content || ''
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ content }))
            } catch {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Internal error' }))
            }
          })
        },
      },
    ],
  }
})
