// Client side: asks our own /api/plan route (which holds the key safely) for a plan.
export async function requestPlan(input) {
  // Strip completed resources before sending to Gemini.
  const filteredInput = {
    ...input,
    resources: (input.resources || []).filter((r) => !r.done),
  }
  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filteredInput),
    })
    return await res.json()
  } catch (e) {
    return { error: 'network', detail: String(e) }
  }
}

// Asks our own /api/roadmap route for the overall path behind the goal.
export async function requestRoadmap(input) {
  try {
    const res = await fetch('/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return await res.json()
  } catch (e) {
    return { error: 'network', detail: String(e) }
  }
}

// How much time is realistically available today, from the saved profile.
export function todayCapacity(profile) {
  const day = new Date().getDay() // 0 Sun ... 6 Sat
  const weekend = day === 0 || day === 6
  if (weekend && (profile?.skipWeekends || profile?.skipWeekend)) return { minutes: 0, dayType: 'a weekend', rest: true }
  const hrs = weekend
    ? Number(profile?.weekend ?? profile?.wkend ?? 2)
    : Number(profile?.weekday ?? profile?.wkday ?? 2)
  return { minutes: Math.round(hrs * 60), dayType: weekend ? 'a weekend' : 'a weekday', rest: false }
}
