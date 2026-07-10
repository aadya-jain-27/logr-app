// Local store. Today it's localStorage; later this becomes the user's account.
const KEY = 'logr-profile'
const PLAN_KEY = 'logr-plan'
const HISTORY_KEY = 'logr-history'
const ROADMAP_KEY = 'logr-roadmap'
const EXTRAS_KEY = 'logr-extras'

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
export function getRoadmap() {
  try { return JSON.parse(localStorage.getItem(ROADMAP_KEY)) } catch { return null }
}
// Returns the cached roadmap only if it still matches the current profile.
export function getValidRoadmap(profile) {
  const saved = getRoadmap()
  return saved && saved.sig === roadmapSignature(profile) ? saved : null
}
export function saveRoadmap(profile, roadmap) {
  const sig = roadmapSignature(profile)
  const prev = getRoadmap()
  const goal = profile?.goal || ''
  // Keep the original start date as long as the goal is unchanged, so adding or editing a
  // resource mid journey does not reset you back to day 1.
  const startDate = prev && prev.goal === goal ? prev.startDate : new Date().toDateString()
  const record = { sig, goal, startDate, roadmap }
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
