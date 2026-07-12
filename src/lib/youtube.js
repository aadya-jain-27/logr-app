// Reads a YouTube video's real title and length in the browser, via YouTube's official
// IFrame API. This runs on the student's own connection, so it works even when YouTube
// blocks our server's requests (which it does for cloud IPs like Vercel's).

export function youTubeId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

let apiPromise = null
function loadIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT) }
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    })
  }
  return apiPromise
}

// Resolves { title, seconds } or null (bad link, embed disabled, or timeout). Never rejects.
export function getYouTubeMeta(url, timeoutMs = 8000) {
  const id = youTubeId(url)
  if (!id || typeof document === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:2px;height:2px;overflow:hidden;'
    const mount = document.createElement('div')
    host.appendChild(mount)
    document.body.appendChild(host)
    let player = null
    let done = false
    const finish = (v) => {
      if (done) return
      done = true
      clearTimeout(timer)
      try { player?.destroy() } catch { /* already gone */ }
      host.remove()
      resolve(v)
    }
    const timer = setTimeout(() => finish(null), timeoutMs)
    loadIframeApi().then((YT) => {
      if (done) return
      player = new YT.Player(mount, {
        width: 2,
        height: 2,
        videoId: id,
        events: {
          onReady: (e) => {
            const seconds = Math.round(e.target.getDuration?.() || 0)
            const title = e.target.getVideoData?.()?.title || ''
            finish(seconds > 0 ? { title, seconds } : null)
          },
          onError: () => finish(null),
        },
      })
    }).catch(() => finish(null))
  })
}
