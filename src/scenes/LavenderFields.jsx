import { motion, useReducedMotion, useTransform } from 'framer-motion'
import { usePointerParallax } from './parallax'
import { Sun } from './parts'
import Particles from '../components/Particles'

function Butterfly({ delay, top, color }) {
  return (
    <motion.div className="absolute" style={{ top }} animate={{ x: ['15vw', '70vw', '40vw', '74vw'], y: [0, -40, 20, -20] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay }}>
      <motion.svg width="16" height="14" viewBox="0 0 16 14" animate={{ scaleX: [1, 0.4, 1] }} transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M8,7 C 2,0 0,9 8,9 C 16,9 14,0 8,7 Z" fill={color} />
      </motion.svg>
    </motion.div>
  )
}

export default function LavenderFields() {
  const reduced = useReducedMotion()
  const { sx } = usePointerParallax(reduced)
  const sunX = useTransform(sx, (v) => v * -4)
  const mtnX = useTransform(sx, (v) => v * 8)
  const rowX = useTransform(sx, (v) => v * 18)
  const rows = [{ y: '56%', c: '#7A5C9E', h: 64 }, { y: '64%', c: '#6A4E8E', h: 86 }, { y: '74%', c: '#583E7A', h: 120 }, { y: '86%', c: '#473066', h: 170 }]

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #8A78B6 0%, #B98EB8 30%, #E0A6B0 50%, #F0C3A6 66%, #E4AE96 100%)' }} />
      <Sun top="17%" left="40%" size={104} color="#FFF0DC" glow="#FBD6C2" x={sunX} />
      <motion.svg className="absolute w-full" style={{ top: '42%', height: '18%', x: mtnX }} viewBox="0 0 1440 140" preserveAspectRatio="none">
        <path d="M0,140 L0,80 L220,40 L420,90 L640,30 L900,90 L1140,45 L1440,90 L1440,140 Z" fill="#6A5C8E" opacity="0.55" />
      </motion.svg>

      {rows.map((r, i) => (
        <motion.div key={i} className="absolute w-full" style={{ top: r.y, height: r.h, x: i > 1 ? rowX : undefined }}>
          <motion.svg className="w-full h-full" viewBox="0 0 1440 60" preserveAspectRatio="none"
            style={{ transformOrigin: 'bottom' }}
            animate={reduced ? {} : { skewX: [-1.5, 1.5, -1.5] }} transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }}>
            <rect width="1440" height="34" y="26" fill={r.c} />
            {Array.from({ length: 61 }).map((_, k) => (
              <line key={k} x1={k * 24 + (i % 2 ? 8 : 0)} y1="42" x2={k * 24 + (i % 2 ? 8 : 0)} y2="12" stroke={r.c} strokeWidth="7" strokeLinecap="round" />
            ))}
          </motion.svg>
        </motion.div>
      ))}

      <Butterfly delay={0} top="40%" color="#FBE3A0" />
      <Butterfly delay={5} top="50%" color="#F6C0D0" />
      <Particles color="rgba(244,224,255,0.85)" count={26} drift="up" reduced={reduced} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 95% at 50% 26%, transparent 55%, rgba(50,34,60,0.2) 100%)' }} />
    </div>
  )
}
