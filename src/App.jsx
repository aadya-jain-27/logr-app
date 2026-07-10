import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { SceneProvider, useScene } from './theme'
import { FocusProvider } from './focus'
import { SoundProvider, useSound } from './sound'
import { startAmbient, stopAmbient, setVolume } from './lib/ambient'
import Scene from './scenes/Scene'
import TopBar from './components/TopBar'
import FocusTimer from './components/FocusTimer'
import Today from './screens/Today'
import Onboarding from './screens/Onboarding'
import Journey from './screens/Journey'
import Path from './screens/Path'
import Calendar from './screens/Calendar'
import Settings from './screens/Settings'
import ShareCard from './screens/ShareCard'
import { isOnboarded, getProfile } from './data/store'
import { scheduleDaily } from './lib/notify'

function Shell() {
  const { scene } = useScene()
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <Scene id={scene} />
      </div>
      <TopBar />
      <main className="relative z-10 min-h-screen">
        <Outlet />
      </main>
      <FocusTimer />
      <SceneAudio />
    </div>
  )
}

// Plays the current scene's ambience while sound is on, and switches it with the world.
function SceneAudio() {
  const { scene } = useScene()
  const { soundOn, volume } = useSound()
  useEffect(() => {
    if (!soundOn) { stopAmbient(); return }
    startAmbient(scene, volume)
    return () => stopAmbient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn, scene])
  useEffect(() => { if (soundOn) setVolume(volume) }, [volume, soundOn])
  return null
}

function NotificationScheduler() {
  useEffect(() => {
    const profile = getProfile()
    if (profile?.notifyAt) scheduleDaily(profile.notifyAt)
  }, [])
  return null
}

export default function App() {
  return (
    <SceneProvider>
      <FocusProvider>
        <SoundProvider>
        <BrowserRouter>
          <NotificationScheduler />
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Navigate to={isOnboarded() ? '/today' : '/welcome'} replace />} />
              <Route path="/welcome" element={<Onboarding />} />
              <Route path="/today" element={<Today />} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/path" element={<Path />} />
              <Route path="/plan" element={<Calendar />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/share" element={<ShareCard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </SoundProvider>
      </FocusProvider>
    </SceneProvider>
  )
}
