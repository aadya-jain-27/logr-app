// Local store. Today it's localStorage; later this becomes the user's account.
const KEY = 'logr-profile'
const PLAN_KEY = 'logr-plan'
const HISTORY_KEY = 'logr-history'
const ROADMAP_KEY = 'logr-roadmap'

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

export function getRawPlan() {
  try { return JSON.parse(localStorage.getItem(PLAN_KEY)) } catch { return null }
}
export function getCachedPlan() {
  const raw = getRawPlan()
  return raw && raw.date === new Date().toDateString() ? raw.plan : null
}
export function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify({ date: new Date().toDateString(), plan }))
  logProgress(plan) // keep history in sync on every save and check-off
}
export function clearPlan() {
  localStorage.removeItem(PLAN_KEY)
}

// The overall path (roadmap) behind the goal. Cached until the goal or resources change.
function roadmapSignature(profile) {
  const names = (profile?.resources || []).map((r) => r.name).join('|')
  return `${profile?.goal || ''}::${profile?.deadline || ''}::${names}`
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
  // Keep the original start date when the same path is refreshed, so "day N" stays honest.
  const startDate = prev && prev.sig === sig ? prev.startDate : new Date().toDateString()
  const record = { sig, startDate, roadmap }
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
