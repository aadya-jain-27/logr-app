import { motion, useReducedMotion, useTransform } from 'framer-motion'
import { usePointerParallax } from './parallax'
import Particles from '../components/Particles'

function Birds({ reduced }) {
  if (reduced) return null
  const birds = [
    { dx: 0, dy: 0, s: 1 }, { dx: 28, dy: 13, s: 0.85 },
    { dx: 52, dy: 3, s: 0.95 }, { dx: 22, dy: -12, s: 0.78 },
  ]
  return (
    <motion.div
      className="absolute" style={{ top: '22%' }}
      initial={{ x: '-12vw' }} animate={{ x: '114vw' }}
      transition={{ duration: 26, repeat: Infinity, repeatDelay: 20, ease: 'easeInOut' }}
    >
      <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}>
        {birds.map((b, i) => (
          <motion.svg
            key={i} width={18 * b.s} height={10 * b.s} viewBox="0 0 18 10"
            style={{ position: 'absolute', left: b.dx, top: b.dy, overflow: 'visible' }}
            animate={{ scaleY: [1, 0.68, 1] }}
            transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
          >
            <path d="M1 6 C 4 1, 6 1, 9 5 C 12 1, 14 1, 17 6" fill="none" stroke="rgba(70,52,46,0.5)" strokeWidth="1.4" strokeLinecap="round" />
          </motion.svg>
        ))}
      </motion.div>
    </motion.div>
  )
}

function Cloud({ top, scale, opacity, duration, delay, parallaxX }) {
  return (
    <motion.div className="absolute" style={{ top, x: parallaxX, left: 0, right: 0 }}>
      <motion.div
        className="absolute" style={{ opacity }}
        initial={{ x: '-15vw' }} animate={{ x: '115vw' }}
        transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
      >
        <svg width={260 * scale} height={90 * scale} viewBox="0 0 260 90" fill="#FBEFDF" style={{ filter: 'blur(6px)' }}>
          <ellipse cx="80" cy="55" rx="78" ry="26" />
          <ellipse cx="150" cy="44" rx="62" ry="30" />
          <ellipse cx="200" cy="58" rx="56" ry="22" />
        </svg>
      </motion.div>
    </motion.div>
  )
}

export default function SunsetValley() {
  const reduced = useReducedMotion()
  const { sx, sy } = usePointerParallax(reduced)

  const cloudA = useTransform(sx, (v) => v * -6)
  const cloudB = useTransform(sx, (v) => v * -10)
  const sunX = useTransform(sx, (v) => v * -4)
  const sunY = useTransform(sy, (v) => v * -2)
  const farX = useTransform(sx, (v) => v * 5)
  const midX = useTransform(sx, (v) => v * 9)
  const hillBX = useTransform(sx, (v) => v * 15)
  const hillFX = useTransform(sx, (v) => v * 24)
  const hillFY = useTransform(sy, (v) => v * 6)

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #B7A6D6 0%, #D7A6B0 24%, #EBA79C 42%, #F4BA8C 64%, #F7D9A8 84%, #EFC79C 100%)',
      }} />

      {/* Sun: glow + slow rays + disc */}
      <motion.div className="absolute" style={{ top: '14%', left: '30%', x: sunX, y: sunY }}>
        <motion.div
          className="absolute" style={{
            width: 620, height: 620, left: -250, top: -250, borderRadius: '50%',
            background: 'repeating-conic-gradient(from 0deg, transparent 0deg 9deg, rgba(255,235,200,0.16) 9deg 11deg)',
            WebkitMaskImage: 'radial-gradient(closest-side, #000 10%, transparent 70%)',
            maskImage: 'radial-gradient(closest-side, #000 10%, transparent 70%)',
            filter: 'blur(2px)',
          }}
          animate={reduced ? {} : { rotate: 360 }}
          transition={{ duration: 200, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute" style={{
          width: 360, height: 360, left: -120, top: -120, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,231,180,0.9) 0%, rgba(255,221,160,0.4) 38%, transparent 68%)', filter: 'blur(6px)',
        }} />
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle at 50% 45%, #FFF1D6, #FFE0A6)', boxShadow: '0 0 60px 20px rgba(255,224,166,0.5)' }} />
      </motion.div>

      {/* Drifting clouds */}
      <Cloud top="12%" scale={1.1} opacity={0.7} duration={190} delay={0} parallaxX={cloudA} />
      <Cloud top="20%" scale={0.8} opacity={0.55} duration={150} delay={-60} parallaxX={cloudB} />
      <Cloud top="8%" scale={0.65} opacity={0.45} duration={230} delay={-120} parallaxX={cloudB} />

      <Birds reduced={reduced} />

      {/* Distant mountains */}
      <motion.svg className="absolute w-full" style={{ bottom: 0, height: '52%', x: farX }} viewBox="0 0 1440 360" preserveAspectRatio="none">
        <path d="M0,360 L0,180 L120,120 L240,170 L360,90 L520,160 L680,70 L840,150 L1000,100 L1180,170 L1320,110 L1440,160 L1440,360 Z" fill="#C2B0CC" opacity="0.85" />
      </motion.svg>
      <motion.svg className="absolute w-full" style={{ bottom: 0, height: '46%', x: midX }} viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path d="M0,320 L0,205 L160,150 L320,210 L480,140 L640,205 L820,130 L1000,205 L1200,150 L1440,210 L1440,320 Z" fill="#9A8FA8" opacity="0.9" />
      </motion.svg>

      {/* Horizon haze */}
      <div className="absolute w-full" style={{ bottom: '30%', height: 120, background: 'linear-gradient(180deg, transparent, rgba(247,217,168,0.55), transparent)', filter: 'blur(8px)' }} />

      {/* Rolling hills */}
      <motion.svg className="absolute w-full" style={{ bottom: 0, height: '34%', x: hillBX }} viewBox="0 0 1440 260" preserveAspectRatio="none">
        <path d="M0,260 L0,140 C 240,90 480,170 720,130 C 980,90 1200,160 1440,120 L1440,260 Z" fill="#5E7E5A" />
      </motion.svg>
      <motion.svg className="absolute w-full" style={{ bottom: 0, height: '25%', x: hillFX, y: hillFY }} viewBox="0 0 1440 240" preserveAspectRatio="none">
        <path d="M0,240 L0,165 C 300,120 520,205 820,150 C 1080,108 1280,185 1440,150 L1440,240 Z" fill="#3C5A45" />
      </motion.svg>

      {/* Pollen motes */}
      <Particles color="rgba(255,238,206,0.9)" count={30} drift="up" reduced={reduced} />

      {/* Cinematic grade + vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 95% at 50% 28%, transparent 55%, rgba(46,32,42,0.24) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,180,120,0.05), transparent 28%, rgba(60,40,60,0.08))', mixBlendMode: 'soft-light' }} />
    </div>
  )
}
