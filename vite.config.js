import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API = 'https://generativelanguage.googleapis.com/v1beta'
// Preferred free, fast models. We also auto-discover whatever your key can use,
// so it works regardless of which models your account has free quota for.
const PREFERRED = ['gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash']
let cachedModel = null

function buildPrompt({ goal, deadline, minutesToday, dayType, material, date, carriedOver, daysAway }) {
  return `You are Logr, a calm, encouraging study coach. Plan ONLY today for this student.

Today is ${date}, which is ${dayType}.
Their goal: ${goal || 'general study progress'}
Target timeframe: ${deadline || 'no fixed deadline'}
Time they can give today: about ${minutesToday} minutes total.
${material ? `Their own study material / topics:\n${material}\n` : ''}${carriedOver && carriedOver.length ? `From a recent day, these were not finished and may still matter: ${carriedOver.join('; ')}. Fold the still relevant ones into today naturally, and drop anything no longer useful. Never pile up old work; today must still fit within ${minutesToday} minutes.\n` : ''}${daysAway >= 2 ? `The student has been away for ${daysAway} days. Welcome them back gently with a lighter, encouraging plan today. Do not overload. Help them restart, not catch up.\n` : ''}
Rules:
- Plan ONLY today. Usually 2 to 4 small, specific, doable tasks that together fit within ${minutesToday} minutes.
- Each task is a concrete action (not vague). Suggest a sensible place to do it in "source".
- Keep it gentle and achievable. Never overload an overwhelmed student.
- Do NOT use em dashes, en dashes, or hyphens between words or numbers. Use commas or periods, and write number ranges with the word "to" (for example, two to three).

Return STRICT JSON in exactly this shape, nothing else:
{
  "tasks": [
    { "title": "string", "kind": "Watch and note" | "Read" | "Practice" | "Solve" | "Build" | "Review", "source": "string", "minutes": number }
  ],
  "goalProgress": number (0 to 100, your honest estimate),
  "pace": "a short reassuring phrase, e.g. nicely paced"
}`
}

async function discoverModels(key) {
  try {
    const r = await fetch(`${API}/models?key=${key}`)
    if (!r.ok) return []
    const d = await r.json()
    return (d.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => m.name.replace('models/', ''))
      .sort((a, b) => {
        const score = (n) => (n.includes('flash-lite') ? 0 : n.includes('flash') ? 1 : n.includes('pro') ? 3 : 2)
        return score(a) - score(b)
      })
  } catch { return [] }
}

async function callModel(key, model, input) {
  const r = await fetch(`${API}/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(input) }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
    }),
  })
  return r
}

async function generatePlan(key, input) {
  const candidates = [...new Set([...(cachedModel ? [cachedModel] : []), ...PREFERRED, ...(await discoverModels(key))])]
  let lastErr = 'no models available'
  for (const model of candidates) {
    let r
    try { r = await callModel(key, model, input) } catch (e) { lastErr = String(e); continue }
    if (r.status === 429 || r.status === 404 || r.status === 400) { lastErr = `${model}: ${r.status}`; continue }
    if (!r.ok) { lastErr = `${model}: ${r.status} ${await r.text()}`; continue }
    const data = await r.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    cachedModel = model
    return { ...JSON.parse(text), _model: model }
  }
  throw new Error(lastErr)
}

// Dev-only API route. The key lives in .env (server-side), never the browser.
function logrApi(env) {
  return {
    name: 'logr-api',
    configureServer(server) {
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
