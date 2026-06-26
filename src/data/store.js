// Local store. Today it's localStorage; later this becomes the user's account.
const KEY = 'logr-profile'
const PLAN_KEY = 'logr-plan'

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

// The raw stored plan, with the date it was made for (used to carry work forward).
export function getRawPlan() {
  try { return JSON.parse(localStorage.getItem(PLAN_KEY)) } catch { return null }
}
// Today's plan only (with its saved completion state), or null on a new day.
export function getCachedPlan() {
  const raw = getRawPlan()
  return raw && raw.date === new Date().toDateString() ? raw.plan : null
}
// Save (or update) today's plan. Called on generate and on every check-off,
// so completion survives a refresh.
export function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify({ date: new Date().toDateString(), plan }))
}
export function clearPlan() {
  localStorage.removeItem(PLAN_KEY)
}
