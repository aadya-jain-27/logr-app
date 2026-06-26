import { useEffect, useRef } from 'react'

// Lightweight floating motes (pollen / dust / snow). Canvas for natural variation.
// Pauses when the tab is hidden; renders a single still frame for reduced-motion.
export default function Particles({ color = 'rgba(255,255,255,0.85)', count = 32, drift = 'up', reduced = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, w, h, dpr
    const ps = []

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const init = () => {
      ps.length = 0
      for (let i = 0; i < count; i++) {
        ps.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.8 + 0.5,
          sp: Math.random() * 0.3 + 0.06,
          drx: (Math.random() - 0.5) * 0.25,
          ph: Math.random() * Math.PI * 2,
          tw: Math.random() * 0.6 + 0.4,
        })
      }
    }
    resize(); init()

    const step = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of ps) {
        const dy = drift === 'down' ? p.sp * 2.4 : -p.sp
        p.y += dy
        p.x += Math.sin(p.ph) * 0.18 + p.drx
        p.ph += 0.01
        if (drift === 'down') { if (p.y > h + 6) { p.y = -6; p.x = Math.random() * w } }
        else if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w }
        if (p.x < -6) p.x = w + 6; if (p.x > w + 6) p.x = -6
        ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(p.ph * p.tw))
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = color; ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(step)
    }

    if (reduced) {
      for (const p of ps) { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill() }
      ctx.globalAlpha = 1
      const onResize = () => { resize(); init() }
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(step) }
    const onResize = () => { resize(); init() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('resize', onResize)
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', onResize)
    }
  }, [color, count, drift, reduced])

  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />
}
