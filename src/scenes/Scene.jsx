import { lazy, Suspense } from 'react'
import { getScene } from './scenes'

// Each world is its own lazy-loaded scene (loads on demand, pauses when hidden).
const SCENE_MAP = {
  sunset: lazy(() => import('./SunsetValley')),
  winter: lazy(() => import('./WinterCabin')),
  rainy: lazy(() => import('./KyotoRain')),
  lakeside: lazy(() => import('./LakesideMorning')),
  lavender: lazy(() => import('./LavenderFields')),
  ocean: lazy(() => import('./OceanCliff')),
}

export default function Scene({ id }) {
  const scene = getScene(id)
  const Active = SCENE_MAP[id] || SCENE_MAP.sunset
  return (
    <Suspense fallback={<div className="absolute inset-0" style={{ background: scene.sky[1] }} />}>
      <Active />
    </Suspense>
  )
}
