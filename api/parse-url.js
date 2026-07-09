import { parseUrl } from '../src/lib/gemini.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end('Method not allowed'); return }
  const key = process.env.GEMINI_API_KEY
  if (!key || key.includes('your_free_gemini')) {
    res.status(200).json({ error: 'no_key' }); return
  }
  try {
    const { url } = req.body || {}
    const result = await parseUrl(key, url)
    res.status(200).json(result)
  } catch (e) {
    res.status(200).json({ error: 'parse_failed', detail: String(e) })
  }
}
