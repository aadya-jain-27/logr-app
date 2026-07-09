import { parseFile } from '../src/lib/gemini.js'

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end('Method not allowed'); return }
  const key = process.env.GEMINI_API_KEY
  if (!key || key.includes('your_free_gemini')) {
    res.status(200).json({ error: 'no_key' }); return
  }
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks)
      const mimeType = req.headers['content-type'] || 'application/pdf'
      const result = await parseFile(key, buffer, mimeType)
      res.status(200).json(result)
    } catch (e) {
      res.status(200).json({ error: 'parse_failed', detail: String(e) })
    }
  })
}
