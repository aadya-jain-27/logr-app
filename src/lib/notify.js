const NOTIFIED_KEY = 'logr-notified-date'
let scheduledTimer = null

export function clearScheduled() {
  if (scheduledTimer) { clearTimeout(scheduledTimer); scheduledTimer = null }
}

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export function scheduleDaily(timeStr) {
  clearScheduled()
  if (!timeStr || !('Notification' in window) || Notification.permission !== 'granted') return

  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0)

  if (target <= now) return // time already passed today

  const alreadyFired = localStorage.getItem(NOTIFIED_KEY) === now.toDateString()
  if (alreadyFired) return

  scheduledTimer = setTimeout(() => {
    try {
      const n = new Notification('Time to plan your day', {
        body: 'Open Logr to see what is next for today.',
        icon: '/favicon.ico',
        tag: 'logr-daily',
      })
      n.onclick = () => { window.focus(); n.close() }
    } catch { /* blocked */ }
    localStorage.setItem(NOTIFIED_KEY, new Date().toDateString())
    scheduledTimer = null
  }, target.getTime() - now.getTime())
}
