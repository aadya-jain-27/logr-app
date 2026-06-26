// Client side: asks our own /api/plan route (which holds the key safely) for a plan.
export async function requestPlan(input) {
  try {
    const res = await fetch('/api/plan', {
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
  if (weekend && profile?.skipWeekends) return { minutes: 0, dayType: 'a weekend', rest: true }
  const hrs = weekend ? Number(profile?.weekend ?? 2) : Number(profile?.weekday ?? 2)
  return { minutes: Math.round(hrs * 60), dayType: weekend ? 'a weekend' : 'a weekday', rest: false }
}
