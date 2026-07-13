// Local store. Today it's localStorage; later this becomes the user's account.
const KEY = 'logr-profile'
const PLAN_KEY = 'logr-plan'
const HISTORY_KEY = 'logr-history'
const ROADMAP_KEY = 'logr-roadmap'
const EXTRAS_KEY = 'logr-extras'
const COVERED_KEY = 'logr-covered'

export function getProfile() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null } catch { return null }
}
export function saveProfile(p) {
  localStorage.setItem(KEY, JSON.stringify(p))
  localStorage.setItem('logr-onboarded', '1')
}
export function isOnboarded() {
  return localStorage.getItem('logr-onboarded') === '1'
}

// A plan is valid only for the day it was made AND the goal/resources/time it was made for.
// Without the signature, changing your goal mid day would keep serving the old plan.
function resourcesSig(resources) {
  return (resources || []).map((r) => `${r.name}~${r.hours || ''}~${r.notes || ''}~${r.done ? 'd' : ''}`).join('|')
}
function planSignature(p) {
  const today = new Date().toDateString()
  const todayCommits = (p?.commitments || []).filter((c) => c.date && new Date(c.date + 'T00:00:00').toDateString() === today).map((c) => c.name).join(',')
  return `${p?.goal || ''}::${p?.deadline || ''}::${resourcesSig(p?.resources)}::${p?.weekday ?? p?.wkday ?? ''}::${p?.weekend ?? p?.wkend ?? ''}::${todayCommits}`
}
export function getRawPlan() {
  try { return JSON.parse(localStorage.getItem(PLAN_KEY)) } catch { return null }
}
export function getCachedPlan() {
  const raw = getRawPlan()
  if (!raw || raw.date !== new Date().toDateString()) return null
  if (raw.sig !== planSignature(getProfile())) return null // goal or resources changed, so replan
  return raw.plan
}
export function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify({ date: new Date().toDateString(), sig: planSignature(getProfile()), plan }))
  logProgress(plan) // keep history in sync on every save and check-off
  recordCovered(plan) // remember completed work so tomorrow's plan never repeats it
}

// A rolling record of work the student has actually finished, so the daily planner can
// move forward instead of re-planning the same material once a resource is exhausted.
export function getCovered() {
  try { return JSON.parse(localStorage.getItem(COVERED_KEY)) || [] } catch { return [] }
}
function recordCovered(plan) {
  const done = (plan?.tasks || []).filter((t) => t.done && t.title).map((t) => t.title.trim())
  if (!done.length) return
  const seen = new Set()
  const merged = [...done, ...getCovered()].filter((title) => {
    const k = title.toLowerCase()
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  }).slice(0, 60) // keep it recent and prompt-sized
  localStorage.setItem(COVERED_KEY, JSON.stringify(merged))
}
export function clearPlan() {
  localStorage.removeItem(PLAN_KEY)
}

// Personal one off tasks the student adds for a specific day, on top of the AI plan.
// Kept separate from the plan so re-planning never wipes what you added yourself.
function readExtras() {
  try { return JSON.parse(localStorage.getItem(EXTRAS_KEY)) || {} } catch { return {} }
}
export function getExtras(dateStr = new Date().toDateString()) {
  return readExtras()[dateStr] || []
}
export function saveExtras(list, dateStr = new Date().toDateString()) {
  const all = readExtras()
  all[dateStr] = list
  localStorage.setItem(EXTRAS_KEY, JSON.stringify(all))
}
export function addExtra(title, minutes = 0, dateStr = new Date().toDateString()) {
  const next = [...getExtras(dateStr), { id: `e${Date.now()}`, title: String(title || '').trim(), minutes: Number(minutes) || 0, done: false }]
  saveExtras(next, dateStr)
  return next
}

// The overall path (roadmap) behind the goal. Cached until the goal or resources change.
function roadmapSignature(profile) {
  return `${profile?.goal || ''}::${profile?.deadline || ''}::${resourcesSig(profile?.resources)}`
}

// Turn a length like "1h 34m", "51m", or "2.5" into a number of hours.
function parseHours(str) {
  const s = String(str || '').toLowerCase()
  const h = (s.match(/(\d+(?:\.\d+)?)\s*h/) || [])[1]
  const m = (s.match(/(\d+)\s*m/) || [])[1]
  let t = 0
  if (h) t += parseFloat(h)
  if (m) t += parseFloat(m) / 60
  if (!h && !m) { const n = parseFloat(s); if (!Number.isNaN(n)) t = n }
  return t
}
// Roughly one study session (about an hour) per day, capped so a short resource never
// stretches across weeks. Unknown length stays small.
function spanForHours(hrs) {
  if (!hrs || hrs <= 0) return 2
  return Math.min(8, Math.max(1, Math.ceil(hrs)))
}
// The model sometimes stretches one resource across many days (for example reading a
// "finish by the 14th" note as a 14 day span). Clamp each span to the resource's real
// length and pack them back to back in the given order, so the calendar shows a tight,
// progressing plan instead of the same resource repeated for two weeks.
function normalizeSchedule(schedule, resources) {
  if (!Array.isArray(schedule) || !schedule.length) return schedule || []
  const byName = {}
  ;(resources || []).forEach((r) => { byName[String(r.name || '').trim().toLowerCase()] = r })
  const ordered = schedule.filter((s) => s && s.resource).sort((a, b) => (a.dayStart || 0) - (b.dayStart || 0))
  let cursor = Math.max(1, ordered[0]?.dayStart || 1)
  return ordered.map((s) => {
    const r = byName[String(s.resource || '').trim().toLowerCase()]
    const modelSpan = Math.max(1, (s.dayEnd || s.dayStart || 1) - (s.dayStart || 1) + 1)
    const span = Math.min(modelSpan, spanForHours(parseHours(r?.hours)))
    const dayStart = cursor
    const dayEnd = cursor + span - 1
    cursor = dayEnd + 1
    return { resource: s.resource, dayStart, dayEnd }
  })
}
export function getRoadmap() {
  try { return JSON.parse(localStorage.getItem(ROADMAP_KEY)) } catch { return null }
}
// Returns the cached roadmap only if it still matches the current profile. The schedule is
// normalized on read too, so roadmaps saved before the span fix also stop repeating.
export function getValidRoadmap(profile) {
  const saved = getRoadmap()
  if (!saved || saved.sig !== roadmapSignature(profile)) return null
  return { ...saved, roadmap: { ...saved.roadmap, schedule: normalizeSchedule(saved.roadmap?.schedule, profile?.resources) } }
}
export function saveRoadmap(profile, roadmap) {
  const sig = roadmapSignature(profile)
  const prev = getRoadmap()
  const goal = profile?.goal || ''
  // Keep the original start date as long as the goal is unchanged, so adding or editing a
  // resource mid journey does not reset you back to day 1.
  const startDate = prev && prev.goal === goal ? prev.startDate : new Date().toDateString()
  const cleaned = roadmap ? { ...roadmap, schedule: normalizeSchedule(roadmap.schedule, profile?.resources) } : roadmap
  const record = { sig, goal, startDate, roadmap: cleaned }
  localStorage.setItem(ROADMAP_KEY, JSON.stringify(record))
  return record
}
export function clearRoadmap() {
  localStorage.removeItem(ROADMAP_KEY)
}
// Which day of the path today is (1-indexed), plus the total span. Null if no matching roadmap.
export function pathDay(profile) {
  const saved = getValidRoadmap(profile)
  if (!saved) return null
  const total = Number(saved.roadmap?.totalDays) || null
  const start = new Date(saved.startDate)
  const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const n = Math.floor((atMidnight(new Date()) - atMidnight(start)) / 86400000) + 1
  const day = total ? Math.min(Math.max(1, n), total) : Math.max(1, n)
  return { day, total }
}

// Returns the most recent day's plan that isn't today (used as fallback when Gemini fails)
export function getYesterdayPlan() {
  try {
    const raw = getRawPlan()
    if (!raw || raw.date === new Date().toDateString()) return null
    return raw.plan
  } catch { return null }
}

// Progress history (for the month-at-a-glance)
export function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || {} } catch { return {} }
}
function logProgress(plan) {
  const h = getHistory()
  const tasks = plan?.tasks || []
  h[new Date().toDateString()] = {
    done: tasks.filter((t) => t.done).length,
    total: tasks.length,
    minutes: tasks.filter((t) => t.done).reduce((s, t) => s + (t.minutes || 0), 0),
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
}

// Aggregate this calendar month. Only ever celebrates activity, never marks absence.
export function monthStats() {
  const h = getHistory()
  const now = new Date()
  const year = now.getFullYear(), month = now.getMonth()
  let tasksDone = 0, minutes = 0, activeDays = 0
  const days = {} // dayOfMonth -> { done, minutes }
  for (const [dateStr, v] of Object.entries(h)) {
    const d = new Date(dateStr)
    if (d.getFullYear() === year && d.getMonth() === month && v.done > 0) {
      tasksDone += v.done
      minutes += v.minutes
      activeDays += 1
      days[d.getDate()] = v
    }
  }
  return { tasksDone, minutes, activeDays, days, year, month }
}
