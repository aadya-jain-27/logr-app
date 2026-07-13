const API = 'https://generativelanguage.googleapis.com/v1beta'
export const PREFERRED = ['gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash']
export let cachedModel = null
export const setCachedModel = (m) => { cachedModel = m }

const sanitize = (s, max = 500) => String(s || '').replace(/<[^>]*>/g, '').trim().slice(0, max)

export function buildPrompt({ goal, deadline, minutesToday, dayType, resources, date, carriedOver, daysAway, todaysCommitments, covered }) {
  const g = sanitize(goal, 200)
  const dl = sanitize(deadline, 100)
  return `You are Logr, a calm, encouraging study coach. Plan ONLY today for this student.

Today is ${date}, which is ${dayType}.
Their goal: ${g || 'general study progress'}
Target timeframe: ${dl || 'no fixed deadline'}
Time they can give today: about ${minutesToday} minutes total.
${resources && resources.length ? `They are learning from these specific resources only. Do not invent or suggest other materials. Plan the NEXT chunk of the relevant one(s) for today, progressing from what they have already done. Read the timing note on each resource as ordinary language in the student's own words, not by matching keywords, and honor what it means. If the note implies today or now, include that resource today. If it implies spreading over several days, today gets one fair chunk, not the whole thing. Never plan more than the available minutes today, and if something is longer than today's time, plan as much as fits and say so honestly in acknowledgements. For "source", use a short human-readable name like the resource name or platform. Never put a URL in "source". If a link is provided, reference that specific resource by name in the task title:\n${resources.map((r) => `- ${sanitize(r.name, 200)}${r.hours ? ` (about ${r.hours})` : ' (length unknown, estimate it)'}${r.url ? ` [${r.url}]` : ''}${r.file ? ` | ${r.file.pageCount ? `${r.file.pageCount} pages, ` : ''}${(r.file.topics || []).length ? `covers: ${(r.file.topics || []).slice(0, 8).join(', ')}` : ''}` : ''}${r.notes ? ` | constraints: ${sanitize(r.notes, 300)}` : ''}`).join('\n')}\n` : ''}${covered && covered.length ? `The student has ALREADY COMPLETED these on earlier days. Do not plan them again, and do not plan trivially reworded versions. Move forward to genuinely new material inside their resources:\n${covered.map((c) => `- ${sanitize(c, 160)}`).join('\n')}\nIf, after skipping everything above, there is no genuinely new material left in their resources, do NOT repeat or repad old work. Instead return an empty "tasks" array and set "caughtUp" to true.\n` : ''}${carriedOver && carriedOver.length ? `From a recent day, these were not finished and may still matter: ${carriedOver.map(s => sanitize(s, 100)).join('; ')}. Fold the still relevant ones into today naturally, and drop anything no longer useful. Never pile up old work; today must still fit within ${minutesToday} minutes.\n` : ''}${daysAway >= 2 ? `The student has been away for ${daysAway} days. Welcome them back gently with a lighter, encouraging plan today. Do not overload. Help them restart, not catch up.\n` : ''}${todaysCommitments && todaysCommitments.length ? `Today the student also has these fixed commitments to handle: ${todaysCommitments.map((c) => `${sanitize(c.name, 100)} (${c.type})`).join(', ')}. Their study time today is already reduced to leave room for these. Keep it gentle, and add a short acknowledgement that today is kept lighter because of them.\n` : ''}
Rules:
- Plan ONLY today. Usually 2 to 4 small, specific, doable tasks. The tasks together must fit within ${minutesToday} minutes and must never exceed it.
- Task minutes must be honest working time for what the task says. Never assign a sliver like 1 to 10 minutes; nobody memorizes or learns anything real in 4 minutes. Every task gets at least 15 minutes, and most should get 25 to 60.
- If a resource note states an amount of time (for example "1 hour today"), give it exactly that much time today, not less.
- When a long resource is being spread over days, today's chunk must be a solid block of at least 30 minutes. Fewer days with solid chunks beats many days of tiny slivers. If today truly has no room for a 30 minute block of it, leave that resource for another day rather than planning a token few minutes.
- Prefer fewer, bigger tasks over many tiny ones. If today's time is short, cut the number of tasks, never their realism.
- Each task is a concrete action (not vague). For "source", use a short human-readable name like the resource name or platform (e.g. "Pandas tutorial", "Coursera", "Chapter 3"). Never put a URL in "source".
- Every task must be distinct. Never repeat a task or list the same thing twice, and never plan anything the student already completed on an earlier day (listed above).
- Never invent filler or generic busywork to fill time. It is better to plan fewer real tasks, or none at all with "caughtUp" true, than to repad finished material.
- Keep it gentle and achievable. Never overload an overwhelmed student.
- Do NOT use em dashes, en dashes, or hyphens between words or numbers. Use commas or periods, and write number ranges with the word "to" (for example, two to three).

Return STRICT JSON in exactly this shape, nothing else:
{
  "tasks": [
    { "title": "string", "kind": "Watch and note" | "Read" | "Practice" | "Solve" | "Build" | "Review", "source": "string", "minutes": number, "tip": "string or null" }
  ],
  "goalProgress": number (0 to 100, your honest estimate),
  "pace": "a short reassuring phrase, e.g. nicely paced",
  "acknowledgements": ["short lines confirming how you honored each pacing constraint from the resource notes, empty array if none"],
  "caughtUp": boolean (true ONLY when there is nothing genuinely new left in their resources to plan, in which case "tasks" MUST be empty; otherwise false)
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
- Fill "schedule": give each resource the STUDENT actually listed a day range that honors what its note MEANS, read as ordinary language in the student's own words, never by matching exact keywords. If the note implies today or now (for example "today for relaxing", "just today", "do it now", "quick one today"), set dayStart and dayEnd both to 1. If it implies spreading over a period (for example "across two weeks", "over the weekend", "a little each day"), size the span to match, but assume real sessions of at least 30 minutes each: a 3 hour video is about six such sessions, so give it around six study days within that period, not a sliver every single day. A DEADLINE note like "finish by the 14th", "by Friday", or "by next week" means finish the resource on or before that point using only as many days as its actual length needs, NEVER stretch one resource across every day until then. The number of days a resource spans must match its real length: about one day per hour of content. A single short resource should almost never span more than about a week. With no note, give a sensible span from the resource length using the same at least 30 minutes per session rule. Only the student's own listed resources go here, never materials you added.

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
    { "resource": "the student's own resource name, exactly as they wrote it, with nothing added like hours or notes", "dayStart": number, "dayEnd": number }
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
    if (!r.ok) { lastErr = `${model}: ${r.status} ${(await r.text()).slice(0, 160)}`; continue }
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

// Analyses text already extracted from the file in the browser, so there is no upload size limit.
export async function parseFile(key, { text, pageCount, name } = {}) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 14000)
  const prompt = `A student uploaded a study document named "${sanitize(name || 'document', 120)}"${pageCount ? ` with about ${pageCount} pages or slides` : ''}. Using the extracted text below, return STRICT JSON: { "title": string, "pageCount": number, "topics": string[] (the main study topics it actually covers, usually three to six, only ones truly present, not padded to a fixed number), "summary": string (2 to 3 sentences) }. Do not use dashes or hyphens. Nothing else.\n\nTEXT:\n${clean}`
  const out = await runWithFallback(key, prompt, 0.3)
  return { title: out.title || name || 'Document', pageCount: Number(out.pageCount) || pageCount || null, topics: Array.isArray(out.topics) ? out.topics.slice(0, 8) : [], summary: out.summary || '' }
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
  const prompt = `A student wants to study from a video titled "${sanitize(title, 200)}". Its description: ${sanitize(description, 600)}. List the main study topics it actually covers, usually three to six, only ones truly present, and do not pad to a fixed number. Return STRICT JSON: { "topics": string[] }. Do not use dashes or hyphens. Nothing else.`
  const out = await runWithFallback(key, prompt, 0.3)
  return Array.isArray(out.topics) ? out.topics.slice(0, 8) : []
}

// Pulls the video id out of any YouTube link form (youtu.be, watch, shorts, embed, live).
function youTubeId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

// YouTube's own player API. Unlike scraping the watch page, this also works from
// datacenter IPs (Vercel), where YouTube serves the page without video metadata.
async function youTubePlayerInfo(videoId) {
  const r = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: { client: { clientName: 'WEB', clientVersion: '2.20240726.00.00', hl: 'en' } },
      videoId,
    }),
    signal: AbortSignal.timeout(6000),
  })
  if (!r.ok) return null
  const d = await r.json()
  const v = d?.videoDetails
  if (!v?.title || !Number(v.lengthSeconds)) return null
  return { title: v.title, secs: Number(v.lengthSeconds), desc: String(v.shortDescription || '') }
}

async function youTubePageInfo(url) {
  const page = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      Cookie: 'CONSENT=YES+1',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!page.ok) return null
  const html = await page.text()
  const secs = Number((html.match(/"lengthSeconds":"(\d+)"/) || [])[1] || 0)
  if (!secs) return null
  return {
    title: decodeEntities((html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || ''),
    secs,
    desc: decodeEntities((html.match(/<meta property="og:description" content="([^"]*)"/) || [])[1] || ''),
  }
}

// Reads a YouTube link. In the browser the video is measured first and passed as a hint,
// so this usually only needs a quick topics call. Server side it also tries YouTube's
// player API and then the watch page, but YouTube blocks datacenter IPs (such as Vercel),
// so when every path fails it returns a graceful error quickly instead of hanging. Only
// YouTube links are supported, so a non YouTube link returns an error rather than a guess.
export async function parseUrl(key, url, hint) {
  const id = youTubeId(url)
  let info = null
  if (hint && Number(hint.seconds) > 0) {
    info = { title: String(hint.title || ''), secs: Number(hint.seconds), desc: '' }
  } else if (id) {
    const canonical = `https://www.youtube.com/watch?v=${id}`
    try { info = await youTubePlayerInfo(id) } catch { /* try the page next */ }
    if (!info) { try { info = await youTubePageInfo(canonical) } catch { /* fall through */ } }
  }
  if (!info) return { error: id ? 'unreadable' : 'not_youtube' }
  let topics = []
  try { topics = await topicsFromText(key, info.title, info.desc.slice(0, 800)) } catch { /* topics are optional */ }
  return { title: info.title, hours: formatLength(info.secs), topics, summary: info.desc.slice(0, 300) }
}
