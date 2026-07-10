const API = 'https://generativelanguage.googleapis.com/v1beta'
export const PREFERRED = ['gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash']
export let cachedModel = null
export const setCachedModel = (m) => { cachedModel = m }

const sanitize = (s, max = 500) => String(s || '').replace(/<[^>]*>/g, '').trim().slice(0, max)

export function buildPrompt({ goal, deadline, minutesToday, dayType, resources, date, carriedOver, daysAway, todaysCommitments }) {
  const g = sanitize(goal, 200)
  const dl = sanitize(deadline, 100)
  return `You are Logr, a calm, encouraging study coach. Plan ONLY today for this student.

Today is ${date}, which is ${dayType}.
Their goal: ${g || 'general study progress'}
Target timeframe: ${dl || 'no fixed deadline'}
Time they can give today: about ${minutesToday} minutes total.
${resources && resources.length ? `They are learning from these specific resources only. Do not invent or suggest other materials. Plan the NEXT chunk of the relevant one(s) for today, progressing from what they have already done. Respect the timing notes on each resource, but never plan more than the available minutes today. If a note says "finish today" and it fits in today's time, plan all of it. If it is longer than today's time, plan as much as fits and note honestly in acknowledgements that it runs longer than today allows. "Divide across N days" means today gets one fair chunk, not the whole thing. For "source", use a short human-readable name like the resource name or platform. Never put a URL in "source". If a link is provided, reference that specific resource by name in the task title:\n${resources.map((r) => `- ${sanitize(r.name, 200)}${r.hours ? ` (about ${r.hours})` : ' (length unknown, estimate it)'}${r.url ? ` [${r.url}]` : ''}${r.file ? ` | ${r.file.pageCount ? `${r.file.pageCount} pages, ` : ''}${(r.file.topics || []).length ? `covers: ${(r.file.topics || []).slice(0, 8).join(', ')}` : ''}` : ''}${r.notes ? ` | constraints: ${sanitize(r.notes, 300)}` : ''}`).join('\n')}\n` : ''}${carriedOver && carriedOver.length ? `From a recent day, these were not finished and may still matter: ${carriedOver.map(s => sanitize(s, 100)).join('; ')}. Fold the still relevant ones into today naturally, and drop anything no longer useful. Never pile up old work; today must still fit within ${minutesToday} minutes.\n` : ''}${daysAway >= 2 ? `The student has been away for ${daysAway} days. Welcome them back gently with a lighter, encouraging plan today. Do not overload. Help them restart, not catch up.\n` : ''}${todaysCommitments && todaysCommitments.length ? `Today the student also has these fixed commitments to handle: ${todaysCommitments.map((c) => `${sanitize(c.name, 100)} (${c.type})`).join(', ')}. Their study time today is already reduced to leave room for these. Keep it gentle, and add a short acknowledgement that today is kept lighter because of them.\n` : ''}
Rules:
- Plan ONLY today. Usually 2 to 4 small, specific, doable tasks. The tasks together must fit within ${minutesToday} minutes and must never exceed it.
- Each task is a concrete action (not vague). For "source", use a short human-readable name like the resource name or platform (e.g. "Pandas tutorial", "Coursera", "Chapter 3"). Never put a URL in "source".
- Every task must be distinct. Never repeat a task or list the same thing twice.
- Keep it gentle and achievable. Never overload an overwhelmed student.
- Do NOT use em dashes, en dashes, or hyphens between words or numbers. Use commas or periods, and write number ranges with the word "to" (for example, two to three).

Return STRICT JSON in exactly this shape, nothing else:
{
  "tasks": [
    { "title": "string", "kind": "Watch and note" | "Read" | "Practice" | "Solve" | "Build" | "Review", "source": "string", "minutes": number, "tip": "string or null" }
  ],
  "goalProgress": number (0 to 100, your honest estimate),
  "pace": "a short reassuring phrase, e.g. nicely paced",
  "acknowledgements": ["short lines confirming how you honored each pacing constraint from the resource notes, empty array if none"]
}

For "acknowledgements": read the notes on each resource. If a note contains a pacing request (a deadline, "finish today", "divide across N days", "cover chapters X to Y"), add ONE short, warm line confirming how today's plan honors it, for example "Covering the DSA sheet over 3 days, as you asked." or "Finishing the pandas video today." Write ranges with the word "to" and use no dashes. If there are no such requests, return an empty array.

For the "tip" field: for Practice, Solve, and Build tasks only, write one or two sentences telling the student exactly where to start right now — name a specific dataset, problem set, page, search phrase, or exercise set. Be concrete and direct (e.g. "Open pandas.pydata.org/docs/user_guide/groupby.html and try the first three examples" or "Search 'numpy array slicing exercises' on w3resource.com"). For Watch, Read, and Review tasks set tip to null.`
}

export function buildRoadmapPrompt({ goal, deadline, weekdayHours, weekendHours, resources }) {
  const g = sanitize(goal, 200)
  const dl = sanitize(deadline, 100)
  const res = (resources || []).filter((r) => !r.done)
  return `You are Logr, a calm study coach. Design an accurate, personalized PATH that actually achieves THIS student's goal within their timeframe. This is the real plan you hold for them, so day to day they only look at today.

Their goal: ${g || 'general study progress'}
Target timeframe: ${dl || 'no fixed deadline, so choose a sensible one and say so'}
Time they can usually give: about ${weekdayHours ?? 2} hours on weekdays and ${weekendHours ?? 3} hours on weekends.
${res.length ? `The student is currently working from these resources. Anchor the path in them and place each where it truly belongs. Honor any timing note exactly: if a note says finish today, this week, or by a date, schedule that resource at the very start, never late:\n${res.map((r) => `- ${sanitize(r.name, 200)}${r.hours ? ` (about ${r.hours})` : ''}${r.file?.pageCount ? ` (${r.file.pageCount} pages)` : ''}${r.file?.topics?.length ? `, topics: ${r.file.topics.slice(0, 8).join(', ')}` : ''}${r.notes ? ` | the student said: ${sanitize(r.notes, 200)}` : ''}`).join('\n')}\n` : 'The student has not listed resources yet.\n'}
Work out what this specific goal genuinely requires from start to finish, then lay it across the timeframe. Where the student's own resources cover a part, use them there. Where the goal needs more than they listed, add specific, mostly free, well known materials BY NAME (real courses, books, sites), never vague advice. Front load what the student is doing right now and anything they marked urgent.

Make it feel handmade for THIS goal:
- Phase titles must be specific to the goal, not generic. Good: "Python and data handling", "Supervised learning and a first model", "DSA and interview prep". Bad: "Building foundations", "Applying knowledge".
- Each phase names the concrete skills or topics it covers and the resources it draws on.
- Include two or three portfolio projects to build that prove the skill, and encourage pushing each to GitHub.
- Fill "schedule": give each resource the STUDENT actually listed a day range that honors its note exactly. "divide across 2 weeks" is a span of about 14 days, "divide across 5 days" about 5 days, "finish today" means dayStart and dayEnd are both 1, "finish this week" about 7 days. With no note, give a sensible span from its length. Only the student's own listed resources go here, never the extra materials you added.

Rules:
- Be realistic about pace for their hours. It is fine to finish a little before the deadline. Never cram, and never pad with filler just to fill time.
- Keep the tone warm and reassuring. This is a map for comfort, not a burden.
- Do NOT use em dashes, en dashes, or hyphens between words or numbers. Use commas or periods, and write ranges with the word "to".

Return STRICT JSON in exactly this shape, nothing else:
{
  "summary": "one or two calm sentences on the shape of the journey, specific to this goal",
  "totalDays": number (whole number of days the path spans, within the timeframe),
  "phases": [
    { "title": "specific phase title", "dayStart": number, "dayEnd": number, "focus": "one line on the concrete skills this phase builds", "resources": ["specific resource or topic names this phase uses"] }
  ],
  "schedule": [
    { "resource": "the student's own resource name, exactly as they wrote it", "dayStart": number, "dayEnd": number }
  ],
  "projects": [
    { "title": "string", "what": "one or two sentences on what to build", "proves": "the skill it demonstrates to a reviewer" }
  ],
  "githubNote": "one short encouraging sentence about pushing this work to GitHub as proof"
}`
}

export async function discoverModels(key) {
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

async function callGenerate(key, model, promptText, temperature) {
  return fetch(`${API}/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { responseMimeType: 'application/json', temperature },
    }),
  })
}

// Tries the cached model first, then preferred, then whatever the key can use.
async function runWithFallback(key, promptText, temperature = 0.7) {
  const candidates = [...new Set([...(cachedModel ? [cachedModel] : []), ...PREFERRED, ...(await discoverModels(key))])]
  let lastErr = 'no models available'
  for (const model of candidates) {
    let r
    try { r = await callGenerate(key, model, promptText, temperature) } catch (e) { lastErr = String(e); continue }
    if (r.status === 429 || r.status === 404 || r.status === 400) { lastErr = `${model}: ${r.status}`; continue }
    if (!r.ok) { lastErr = `${model}: ${r.status} ${await r.text()}`; continue }
    const data = await r.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    setCachedModel(model)
    return { ...JSON.parse(text), _model: model }
  }
  throw new Error(lastErr)
}

export async function generatePlan(key, input) {
  return runWithFallback(key, buildPrompt(input), 0.7)
}

export async function generateRoadmap(key, input) {
  return runWithFallback(key, buildRoadmapPrompt(input), 0.6)
}

export async function parseFile(key, buffer, mimeType) {
  const uploadRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': mimeType, 'X-Goog-Upload-Protocol': 'raw' },
    body: buffer,
  })
  if (!uploadRes.ok) throw new Error(`upload failed: ${uploadRes.status}`)
  const { file } = await uploadRes.json()
  const model = cachedModel || PREFERRED[0]
  const genRes = await fetch(`${API}/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [
        { file_data: { mime_type: mimeType, file_uri: file.uri } },
        { text: 'Analyse this document. Return JSON: { "title": string, "pageCount": number, "topics": string[], "summary": string (2 to 3 sentences) }. Nothing else.' }
      ]}],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
    }),
  })
  const data = await genRes.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  return JSON.parse(text)
}

function formatLength(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m || 1}m`
}

function decodeEntities(str) {
  return String(str || '')
    .replace(/\\u0026/g, '&').replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

// Fast, text only topic extraction from a title and description. No video processing.
async function topicsFromText(key, title, description) {
  const prompt = `A student wants to study from a video titled "${sanitize(title, 200)}". Its description: ${sanitize(description, 600)}. List up to 8 key study topics it likely covers. Return STRICT JSON: { "topics": string[] }. Do not use dashes or hyphens. Nothing else.`
  const out = await runWithFallback(key, prompt, 0.3)
  return Array.isArray(out.topics) ? out.topics.slice(0, 8) : []
}

// Reads a YouTube link. Fast path scrapes the watch page for exact length and title;
// only topics use the model (a quick text call). Falls back to full video understanding.
export async function parseUrl(key, url) {
  try {
    const page = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: 'CONSENT=YES+1',
      },
    })
    if (page.ok) {
      const html = await page.text()
      const secs = Number((html.match(/"lengthSeconds":"(\d+)"/) || [])[1] || 0)
      const title = decodeEntities((html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || '')
      const desc = decodeEntities((html.match(/<meta property="og:description" content="([^"]*)"/) || [])[1] || '')
      if (secs > 0) {
        let topics = []
        try { topics = await topicsFromText(key, title, desc) } catch { /* topics are optional */ }
        return { title, hours: formatLength(secs), topics, summary: desc.slice(0, 300) }
      }
    }
  } catch { /* fall through to video understanding */ }
  return parseUrlViaVideo(key, url)
}

// Fallback only: let the model watch the whole video. Slower, so we try the scrape first.
async function parseUrlViaVideo(key, url) {
  const prompt = 'This is a YouTube video a student wants to study from. Return JSON: { "title": string, "hours": string (approximate length written like "1h 15m" or "45m"), "topics": string[] (up to 8 key topics it covers), "summary": string (2 to 3 sentences) }. Do not use dashes or hyphens. Nothing else.'
  const candidates = [...new Set(['gemini-2.5-flash', 'gemini-2.0-flash', ...(cachedModel ? [cachedModel] : []), ...(await discoverModels(key))])]
  let lastErr = 'no models available'
  for (const model of candidates) {
    let r
    try {
      r = await fetch(`${API}/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ file_data: { file_uri: url } }, { text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3, mediaResolution: 'MEDIA_RESOLUTION_LOW', thinkingConfig: { thinkingBudget: 0 } },
        }),
      })
    } catch (e) { lastErr = String(e); continue }
    if (r.status === 429 || r.status === 404 || r.status === 400) { lastErr = `${model}: ${r.status}`; continue }
    if (!r.ok) { lastErr = `${model}: ${r.status}`; continue }
    const data = await r.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    return JSON.parse(text)
  }
  throw new Error(lastErr)
}
