import { motion, useReducedMotion, useTransform } from 'framer-motion'
import { usePointerParallax } from './parallax'
import { Sun, Cloud, Birds } from './parts'
import Particles from '../components/Particles'

function Wave({ bottom, color, dur, amp, op, reduced }) {
  return (
    <motion.div className="absolute" style={{ bottom, left: '-10%', width: '120%', opacity: op }}
      animate={reduced ? {} : { x: [0, -amp, 0] }} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}>
      <svg className="w-full" height="80" viewBox="0 0 1600 80" preserveAspectRatio="none" style={{ display: 'block' }}>
        <path d="M0,40 C 200,10 400,70 600,40 C 800,10 1000,70 1200,40 C 1400,10 1600,70 1600,40 L1600,80 L0,80 Z" fill={color} />
      </svg>
    </motion.div>
  )
}

export default function OceanCliff() {
  const reduced = useReducedMotion()
  const { sx, sy } = usePointerParallax(reduced)
  const sunX = useTransform(sx, (v) => v * -4)
  const cl = useTransform(sx, (v) => v * -7)
  const cliffX = useTransform(sx, (v) => v * 22)
  const cliffY = useTransform(sy, (v) => v * 7)

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #A6D7E6 0%, #C9E6E4 40%, #E6F1E6 55%, #7FB6B6 100%)' }} />
      <Sun top="17%" left="50%" size={90} color="#FFFFFF" glow="#FFF6D8" x={sunX} />
      <Cloud top="11%" scale={1} opacity={0.65} duration={205} color="rgba(255,255,255,0.7)" parallaxX={cl} reduced={reduced} />
      <Cloud top="20%" scale={0.7} opacity={0.5} duration={165} delay={-60} color="rgba(255,255,255,0.6)" parallaxX={cl} reduced={reduced} />
      <Birds top="26%" color="rgba(60,80,90,0.55)" duration={30} repeatDelay={16} reduced={reduced} />

      {/* Sun glitter */}
      <motion.div className="absolute" style={{ left: '50%', bottom: 0, width: 72, height: '44%', background: 'linear-gradient(180deg, rgba(255,250,220,0.7), transparent)', filter: 'blur(5px)' }}
        animate={reduced ? {} : { opacity: [0.5, 0.85, 0.5] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Waves */}
      <Wave bottom="34%" color="#9FCFCB" dur={11} amp={40} op={0.7} reduced={reduced} />
      <Wave bottom="22%" color="#74B2AE" dur={9} amp={60} op={0.85} reduced={reduced} />
      <Wave bottom="6%" color="#4E938F" dur={7} amp={80} op={1} reduced={reduced} />

      {/* Cliff */}
      <motion.svg className="absolute" style={{ bottom: 0, right: 0, width: '46%', height: '72%', x: cliffX, y: cliffY }} viewBox="0 0 700 500" preserveAspectRatio="xMaxYMax meet">
        <path d="M700,500 L700,40 C 560,60 520,150 500,260 C 486,330 430,420 360,500 Z" fill="#2C5560" />
        <path d="M700,500 L700,120 C 600,150 560,240 540,360 C 528,420 500,470 470,500 Z" fill="#21454E" />
      </motion.svg>

      <Particles color="rgba(255,255,255,0.8)" count={16} drift="up" reduced={reduced} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 95% at 50% 28%, transparent 58%, rgba(30,50,55,0.18) 100%)' }} />
    </div>
  )
}
