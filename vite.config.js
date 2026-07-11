import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { generatePlan, generateRoadmap, parseFile, parseUrl } from './src/lib/gemini.js'

// Dev-only API middleware. In production, Vercel picks up /api/*.js as serverless functions.
function logrApi(env) {
  return {
    name: 'logr-api',
    configureServer(server) {
      server.middlewares.use('/api/parse-file', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json')
          const key = env.GEMINI_API_KEY
          if (!key || key.includes('your_free_gemini')) { res.end(JSON.stringify({ error: 'no_key' })); return }
          try {
            const result = await parseFile(key, JSON.parse(body || '{}'))
            res.end(JSON.stringify(result))
          } catch (e) {
            res.end(JSON.stringify({ error: 'parse_failed', detail: String(e) }))
          }
        })
      })
      server.middlewares.use('/api/parse-url', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json')
          const key = env.GEMINI_API_KEY
          if (!key || key.includes('your_free_gemini')) { res.end(JSON.stringify({ error: 'no_key' })); return }
          try {
            const { url } = JSON.parse(body || '{}')
            const result = await parseUrl(key, url)
            res.end(JSON.stringify(result))
          } catch (e) {
            res.end(JSON.stringify({ error: 'parse_failed', detail: String(e) }))
          }
        })
      })
      server.middlewares.use('/api/plan', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json')
          const key = env.GEMINI_API_KEY
          if (!key || key.includes('your_free_gemini')) { res.end(JSON.stringify({ error: 'no_key' })); return }
          try {
            const plan = await generatePlan(key, JSON.parse(body || '{}'))
            res.end(JSON.stringify(plan))
          } catch (e) {
            res.end(JSON.stringify({ error: 'generation_failed', detail: String(e) }))
          }
        })
      })
      server.middlewares.use('/api/roadmap', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json')
          const key = env.GEMINI_API_KEY
          if (!key || key.includes('your_free_gemini')) { res.end(JSON.stringify({ error: 'no_key' })); return }
          try {
            const roadmap = await generateRoadmap(key, JSON.parse(body || '{}'))
            res.end(JSON.stringify(roadmap))
          } catch (e) {
            res.end(JSON.stringify({ error: 'generation_failed', detail: String(e) }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), logrApi(env)],
    server: { port: 5180 },
  }
})
