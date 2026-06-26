// Local store. Today it's localStorage; later this becomes the user's account.
const KEY = 'logr-profile'
const PLAN_KEY = 'logr-plan'
const HISTORY_KEY = 'logr-history'

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

// ---- Progress history (for the month-at-a-glance) ----
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
