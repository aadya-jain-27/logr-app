import { useEffect } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'

// Gentle pointer parallax. Returns springy normalized (-1..1) motion values.
export function usePointerParallax(disabled) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 35, damping: 22, mass: 0.8 })
  const sy = useSpring(y, { stiffness: 35, damping: 22, mass: 0.8 })

  useEffect(() => {
    if (disabled) return
    const onMove = (e) => {
      x.set((e.clientX / window.innerWidth - 0.5) * 2)
      y.set((e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [disabled, x, y])

  return { sx, sy }
}
