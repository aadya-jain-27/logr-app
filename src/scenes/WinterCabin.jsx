import { motion, useReducedMotion, useTransform } from 'framer-motion'
import { usePointerParallax } from './parallax'
import { Stars } from './parts'
import Particles from '../components/Particles'

function Smoke({ reduced }) {
  if (reduced) return null
  return (
    <div className="absolute" style={{ left: 'calc(50% + 2px)', bottom: '34%' }}>
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="absolute rounded-full" style={{ width: 12, height: 12, background: 'rgba(230,238,255,0.16)', filter: 'blur(4px)' }}
          initial={{ y: 0, opacity: 0 }} animate={{ y: -80, x: [-2, 8, -1], opacity: [0, 0.5, 0], scale: [0.6, 1.6, 2.2] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeOut', delay: i * 2.4 }} />
      ))}
    </div>
  )
}

export default function WinterCabin() {
  const reduced = useReducedMotion()
  const { sx, sy } = usePointerParallax(reduced)
  const moonX = useTransform(sx, (v) => v * -4)
  const groundX = useTransform(sx, (v) => v * 16)
  const groundY = useTransform(sy, (v) => v * 5)

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0C1430 0%, #16244A 45%, #243A66 76%, #34507E 100%)' }} />
      <Stars count={28} reduced={reduced} />

      {/* Moon */}
      <motion.div className="absolute" style={{ top: '13%', left: '30%', x: moonX }}>
        <div style={{ position: 'absolute', width: 300, height: 300, left: -95, top: -95, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,216,250,0.5), transparent 68%)', filter: 'blur(6px)' }} />
        <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle at 42% 40%, #EAF1FF, #AFC2EC)', boxShadow: '0 0 60px 16px rgba(175,194,236,0.4)' }} />
      </motion.div>

      {/* Snow */}
      <Particles color="rgba(255,255,255,0.92)" count={80} drift="down" reduced={reduced} />

      {/* Village */}
      <motion.div className="absolute w-full" style={{ bottom: 0, height: '46%', x: groundX, y: groundY }}>
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 340" preserveAspectRatio="xMidYMax slice" style={{ overflow: 'visible' }}>
          <path d="M0,340 L0,240 C 380,206 1060,206 1440,240 L1440,340 Z" fill="#26395C" />
          {[120, 205, 300, 1140, 1235, 1330].map((cx, i) => (
            <g key={i}>
              <path d={`M${cx},150 L${cx - 36},252 L${cx + 36},252 Z`} fill="#0E1A30" />
              <path d={`M${cx},196 L${cx - 42},258 L${cx + 42},258 Z`} fill="#0A1426" />
            </g>
          ))}
          <g>
            <rect x="650" y="196" width="160" height="82" rx="4" fill="#1B2848" />
            <path d="M638,198 L730,150 L822,198 Z" fill="#0F1A32" />
          </g>
        </svg>
        {/* Glowing windows */}
        <motion.div className="absolute" style={{ left: 'calc(50% - 34px)', bottom: '18%', width: 26, height: 26, borderRadius: 4, background: '#FFD79A', boxShadow: '0 0 26px 9px rgba(255,200,130,0.6)' }}
          animate={reduced ? {} : { opacity: [0.8, 1, 0.82] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute" style={{ left: 'calc(50% + 12px)', bottom: '18%', width: 26, height: 26, borderRadius: 4, background: '#FFD79A', boxShadow: '0 0 26px 9px rgba(255,200,130,0.6)' }}
          animate={reduced ? {} : { opacity: [0.9, 1, 0.85] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
        <Smoke reduced={reduced} />
      </motion.div>

      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 95% at 50% 24%, transparent 52%, rgba(6,10,24,0.42) 100%)' }} />
    </div>
  )
}
