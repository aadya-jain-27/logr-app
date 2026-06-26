import { motion, useReducedMotion, useTransform } from 'framer-motion'
import { usePointerParallax } from './parallax'
import Particles from '../components/Particles'

// Mood scaffold for scenes whose bespoke elements (snow, rain, lanterns, waves)
// are coming next. Still alive: gradient sky, soft light, drifting cloud, motes.
export default function AtmosphereScene({ scene }) {
  const reduced = useReducedMotion()
  const { sx, sy } = usePointerParallax(reduced)
  const cloudX = useTransform(sx, (v) => v * -8)
  const glowX = useTransform(sx, (v) => v * -4)
  const hillX = useTransform(sx, (v) => v * 18)
  const hillY = useTransform(sy, (v) => v * 6)

  const [a, b, c, d] = scene.sky
  const drift = scene.id === 'winter' || scene.id === 'rainy' ? 'down' : 'up'
  const count = scene.id === 'winter' ? 70 : scene.id === 'rainy' ? 90 : 30

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${a} 0%, ${b} 40%, ${c} 72%, ${d} 100%)` }} />

      {/* Soft sun / moon glow */}
      <motion.div className="absolute" style={{ top: '16%', left: '34%', x: glowX }}>
        <div style={{
          width: 340, height: 340, borderRadius: '50%',
          background: `radial-gradient(circle, ${scene.glow} 0%, ${scene.glow}55 36%, transparent 70%)`,
          filter: 'blur(4px)', opacity: scene.dark ? 0.7 : 0.9,
        }} />
        <div style={{ position: 'absolute', top: 110, left: 110, width: 110, height: 110, borderRadius: '50%', background: scene.glow, filter: 'blur(2px)', opacity: 0.9 }} />
      </motion.div>

      {/* Drifting cloud / haze band */}
      <motion.div className="absolute" style={{ top: '18%', left: 0, right: 0, x: cloudX }}>
        <motion.div className="absolute" initial={{ x: '-15vw' }} animate={reduced ? {} : { x: '115vw' }} transition={{ duration: 200, repeat: Infinity, ease: 'linear' }}>
          <svg width="280" height="90" viewBox="0 0 260 90" fill={scene.dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)'} style={{ filter: 'blur(7px)' }}>
            <ellipse cx="80" cy="55" rx="78" ry="24" /><ellipse cx="150" cy="44" rx="62" ry="28" /><ellipse cx="200" cy="58" rx="56" ry="20" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Distant silhouette */}
      <motion.svg className="absolute w-full" style={{ bottom: 0, height: '40%', x: hillX, y: hillY }} viewBox="0 0 1440 300" preserveAspectRatio="none">
        <path d="M0,300 L0,150 C 260,100 520,190 760,140 C 1020,95 1240,180 1440,135 L1440,300 Z" fill={scene.silhouette} opacity="0.92" />
      </motion.svg>

      <Particles color={scene.particle} count={count} drift={drift} reduced={reduced} />

      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 95% at 50% 28%, transparent 55%, rgba(20,16,26,0.28) 100%)' }} />
    </div>
  )
}
