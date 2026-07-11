import { parseFile } from '../src/lib/gemini.js'

// Receives { data: base64, mimeType } as JSON so Vercel's default body parsing works.
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end('Method not allowed'); return }
  const key = process.env.GEMINI_API_KEY
  if (!key || key.includes('your_free_gemini')) {
    res.status(200).json({ error: 'no_key' }); return
  }
  try {
    const { data, mimeType } = req.body || {}
    const buffer = Buffer.from(data || '', 'base64')
    const result = await parseFile(key, buffer, mimeType || 'application/pdf')
    res.status(200).json(result)
  } catch (e) {
    res.status(200).json({ error: 'parse_failed', detail: String(e) })
  }
}
