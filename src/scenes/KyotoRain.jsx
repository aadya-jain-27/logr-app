import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, useTransform } from 'framer-motion'
import { usePointerParallax } from './parallax'

function RainCanvas({ reduced }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'); let raf, w, h, dpr
    const drops = []
    const resize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    const init = () => { drops.length = 0; for (let i = 0; i < 150; i++) drops.push({ x: Math.random() * w, y: Math.random() * h, l: Math.random() * 14 + 8, sp: Math.random() * 4 + 7 }) }
    resize(); init()
    const step = () => {
      ctx.clearRect(0, 0, w, h); ctx.strokeStyle = 'rgba(185,202,230,0.22)'; ctx.lineWidth = 1
      for (const d of drops) { ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 2.2, d.y + d.l); ctx.stroke(); d.y += d.sp; d.x -= 0.5; if (d.y > h) { d.y = -d.l; d.x = Math.random() * w } }
      raf = requestAnimationFrame(step)
    }
    if (reduced) { ctx.strokeStyle = 'rgba(185,202,230,0.18)'; ctx.lineWidth = 1; for (const d of drops) { ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 2.2, d.y + d.l); ctx.stroke() } return }
    const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(step) }
    const onResize = () => { resize(); init() }
    document.addEventListener('visibilitychange', onVis); window.addEventListener('resize', onResize); raf = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('resize', onResize) }
  }, [reduced])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />
}

export default function KyotoRain() {
  const reduced = useReducedMotion()
  const { sx, sy } = usePointerParallax(reduced)
  const bX = useTransform(sx, (v) => v * 10)
  const fX = useTransform(sx, (v) => v * 20)
  const fY = useTransform(sy, (v) => v * 6)

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #14151E 0%, #22202E 45%, #352B3C 78%, #201823 100%)' }} />
      <div className="absolute w-full" style={{ top: '40%', height: 170, background: 'linear-gradient(180deg, transparent, rgba(120,120,150,0.12), transparent)', filter: 'blur(10px)' }} />

      {/* Buildings */}
      <motion.svg className="absolute w-full" style={{ bottom: 0, height: '48%', x: bX }} viewBox="0 0 1440 360" preserveAspectRatio="none">
        <path d="M0,360 L0,210 L120,210 L120,150 L240,150 L240,220 L420,220 L420,120 L520,120 L520,220 L700,220 L700,170 L820,170 L820,230 L1040,230 L1040,140 L1140,140 L1140,225 L1300,225 L1300,180 L1440,180 L1440,360 Z" fill="#16121C" />
      </motion.svg>

      {/* Neon sign */}
      <motion.div className="absolute" style={{ left: '17%', top: '43%' }} animate={reduced ? {} : { opacity: [0.7, 1, 0.78, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
        <div style={{ width: 56, height: 22, borderRadius: 4, background: 'rgba(232,113,142,0.16)', boxShadow: '0 0 22px 7px rgba(232,113,142,0.55)', border: '1px solid rgba(232,113,142,0.6)' }} />
      </motion.div>

      {/* Lanterns */}
      <motion.div className="absolute" style={{ right: '24%', top: '28%', x: fX, y: fY }}>
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="absolute" style={{ left: i * 72, top: i * 16 }} animate={reduced ? {} : { rotate: [-3, 3, -3] }} transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}>
            <div style={{ width: 30, height: 42, borderRadius: '42% 42% 46% 46%', background: 'radial-gradient(circle at 50% 38%, #FFB36A, #D2536F)', boxShadow: '0 0 28px 9px rgba(232,113,142,0.5)' }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Wet street reflection */}
      <motion.div className="absolute w-full" style={{ bottom: 0, height: '16%', background: 'linear-gradient(180deg, transparent, rgba(232,113,142,0.12))' }}
        animate={reduced ? {} : { opacity: [0.55, 0.9, 0.55] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />

      <RainCanvas reduced={reduced} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 95% at 50% 30%, transparent 50%, rgba(6,6,12,0.5) 100%)' }} />
    </div>
  )
}
