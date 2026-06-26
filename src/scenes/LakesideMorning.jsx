import { motion, useReducedMotion, useTransform } from 'framer-motion'
import { usePointerParallax } from './parallax'
import { Sun, Cloud } from './parts'
import Particles from '../components/Particles'

function Duck({ delay, top, dur }) {
  return (
    <motion.div className="absolute" style={{ top }} initial={{ x: '12vw' }} animate={{ x: '74vw' }} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay, repeatType: 'reverse' }}>
      <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
        <svg width="36" height="22" viewBox="0 0 36 22"><ellipse cx="16" cy="14" rx="14" ry="6" fill="#3A4E48" /><path d="M25,11 q7,-9 10,-2 q-3,2 -7,3 Z" fill="#3A4E48" /></svg>
      </motion.div>
    </motion.div>
  )
}

export default function LakesideMorning() {
  const reduced = useReducedMotion()
  const { sx, sy } = usePointerParallax(reduced)
  const cl = useTransform(sx, (v) => v * -7)
  const hillX = useTransform(sx, (v) => v * 10)
  const reedX = useTransform(sx, (v) => v * 22)
  const sunX = useTransform(sx, (v) => v * -4)

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #CFE8E1 0%, #E7E0C8 40%, #F3E6CF 58%, #D8C6AE 100%)' }} />
      <Sun top="20%" left="46%" size={94} color="#FFF4DC" glow="#FCE6B4" x={sunX} />
      <Cloud top="13%" scale={0.9} opacity={0.55} duration={210} color="rgba(255,255,255,0.6)" parallaxX={cl} reduced={reduced} />
      <Cloud top="22%" scale={0.6} opacity={0.4} duration={165} delay={-60} color="rgba(255,255,255,0.5)" parallaxX={cl} reduced={reduced} />

      <motion.svg className="absolute w-full" style={{ top: '40%', height: '16%', x: hillX }} viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0,120 L0,70 C 280,40 520,82 760,55 C 1020,30 1240,72 1440,50 L1440,120 Z" fill="#7E9A86" opacity="0.7" />
      </motion.svg>
      <div className="absolute w-full" style={{ top: '49%', height: 90, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.5), transparent)', filter: 'blur(8px)' }} />

      {/* Water */}
      <div className="absolute w-full" style={{ bottom: 0, height: '42%', background: 'linear-gradient(180deg, #BFD8D0, #8FB6AE 55%, #6E9E96)' }} />
      <motion.div className="absolute" style={{ left: '46%', bottom: 0, width: 64, height: '42%', background: 'linear-gradient(180deg, rgba(255,240,200,0.7), transparent)', filter: 'blur(5px)' }}
        animate={reduced ? {} : { opacity: [0.5, 0.85, 0.5], scaleX: [1, 1.3, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
      {!reduced && [0, 1, 2].map((i) => (
        <motion.div key={i} className="absolute" style={{ left: '28%', right: '20%', bottom: `${12 + i * 9}%`, height: 1, background: 'rgba(255,255,255,0.25)' }}
          animate={{ opacity: [0.1, 0.4, 0.1], scaleX: [0.9, 1, 0.9] }} transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }} />
      ))}

      <Duck delay={0} top="64%" dur={42} />
      <Duck delay={6} top="73%" dur={54} />
      {!reduced && (
        <motion.div className="absolute" style={{ top: '52%' }} animate={{ x: ['20vw', '60vw', '34vw', '56vw'], y: [0, -32, 12, -16] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(70,90,90,0.7)' }} />
        </motion.div>
      )}
      <Particles color="rgba(255,250,236,0.85)" count={20} drift="up" reduced={reduced} />

      {/* Reeds */}
      <motion.svg className="absolute" style={{ bottom: 0, left: 0, width: 240, height: '36%', x: reedX }} viewBox="0 0 240 200" preserveAspectRatio="xMinYMax meet">
        {[24, 46, 70, 96].map((x, i) => (
          <motion.path key={i} d={`M${x},200 C ${x - 6},130 ${x + 6},90 ${x},38`} stroke="#3E5A4A" strokeWidth="4" fill="none" strokeLinecap="round"
            style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
            animate={reduced ? {} : { rotate: [-2.5, 3, -2.5] }} transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
      </motion.svg>

      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 95% at 50% 30%, transparent 58%, rgba(60,60,40,0.16) 100%)' }} />
    </div>
  )
}
