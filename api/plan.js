import { generatePlan } from '../src/lib/gemini.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end('Method not allowed'); return }
  const key = process.env.GEMINI_API_KEY
  if (!key || key.includes('your_free_gemini')) {
    res.status(200).json({ error: 'no_key' }); return
  }
  try {
    const plan = await generatePlan(key, req.body || {})
    res.status(200).json(plan)
  } catch (e) {
    res.status(200).json({ error: 'generation_failed', detail: String(e) })
  }
}
