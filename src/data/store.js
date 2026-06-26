// Local store. Today it's localStorage; later this becomes the user's account
// (GET/PUT /api/me/profile, /api/today). The AI plan engine reads the profile.
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

// Today's plan is cached so it doesn't regenerate on every visit. Keyed by date,
// so it naturally refreshes tomorrow. "Re-plan" clears it.
export function getCachedPlan() {
  try {
    const v = JSON.parse(localStorage.getItem(PLAN_KEY))
    return v && v.date === new Date().toDateString() ? v.plan : null
  } catch { return null }
}
export function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify({ date: new Date().toDateString(), plan }))
}
export function clearPlan() {
  localStorage.removeItem(PLAN_KEY)
}
