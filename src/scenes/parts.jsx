import { motion } from 'framer-motion'

// Shared, reusable scene props so every world stays light and consistent.

export function Sun({ top = '16%', left = '32%', size = 110, color = '#FFF1D6', glow = '#FFE0A6', x, y }) {
  return (
    <motion.div className="absolute" style={{ top, left, x, y }}>
      <div className="absolute" style={{ width: size * 3, height: size * 3, left: -size, top: -size, borderRadius: '50%', background: `radial-gradient(circle, ${glow}cc 0%, ${glow}55 36%, transparent 70%)`, filter: 'blur(6px)' }} />
      <div style={{ width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 50% 45%, ${color}, ${glow})`, boxShadow: `0 0 70px 24px ${glow}66` }} />
    </motion.div>
  )
}

export function Cloud({ top, scale = 1, opacity = 0.6, duration = 180, delay = 0, color = 'rgba(255,255,255,0.5)', parallaxX, reduced }) {
  return (
    <motion.div className="absolute" style={{ top, left: 0, right: 0, x: parallaxX }}>
      <motion.div className="absolute" style={{ opacity }} initial={{ x: '-15vw' }} animate={reduced ? {} : { x: '115vw' }} transition={{ duration, repeat: Infinity, ease: 'linear', delay }}>
        <svg width={260 * scale} height={90 * scale} viewBox="0 0 260 90" fill={color} style={{ filter: 'blur(7px)' }}>
          <ellipse cx="80" cy="55" rx="78" ry="24" /><ellipse cx="150" cy="44" rx="62" ry="28" /><ellipse cx="200" cy="58" rx="56" ry="20" />
        </svg>
      </motion.div>
    </motion.div>
  )
}

export function Birds({ top = '22%', color = 'rgba(70,52,46,0.5)', duration = 26, delay = 0, repeatDelay = 20, reduced }) {
  if (reduced) return null
  const birds = [{ dx: 0, dy: 0, s: 1 }, { dx: 28, dy: 13, s: 0.85 }, { dx: 52, dy: 3, s: 0.95 }, { dx: 22, dy: -12, s: 0.78 }]
  return (
    <motion.div className="absolute" style={{ top }} initial={{ x: '-12vw' }} animate={{ x: '114vw' }} transition={{ duration, repeat: Infinity, repeatDelay, ease: 'easeInOut', delay }}>
      <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}>
        {birds.map((b, i) => (
          <motion.svg key={i} width={18 * b.s} height={10 * b.s} viewBox="0 0 18 10" style={{ position: 'absolute', left: b.dx, top: b.dy, overflow: 'visible' }} animate={{ scaleY: [1, 0.68, 1] }} transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}>
            <path d="M1 6 C 4 1, 6 1, 9 5 C 12 1, 14 1, 17 6" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
          </motion.svg>
        ))}
      </motion.div>
    </motion.div>
  )
}

export function Stars({ count = 22, reduced }) {
  const stars = Array.from({ length: count }).map((_, i) => ({ x: (i * 53) % 100, y: (i * 37) % 52, r: (i % 3) * 0.5 + 0.7, d: (i % 5) * 0.6 + 2.4 }))
  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((s, i) => (
        <motion.div key={i} className="absolute rounded-full" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, background: 'white' }}
          animate={reduced ? { opacity: 0.6 } : { opacity: [0.2, 0.9, 0.2] }} transition={{ duration: s.d, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }} />
      ))}
    </div>
  )
}
