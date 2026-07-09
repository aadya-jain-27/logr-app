import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { SceneProvider, useScene } from './theme'
import { FocusProvider } from './focus'
import Scene from './scenes/Scene'
import TopBar from './components/TopBar'
import FocusTimer from './components/FocusTimer'
import Today from './screens/Today'
import Onboarding from './screens/Onboarding'
import Journey from './screens/Journey'
import Path from './screens/Path'
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
    </div>
  )
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
        <BrowserRouter>
          <NotificationScheduler />
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Navigate to={isOnboarded() ? '/today' : '/welcome'} replace />} />
              <Route path="/welcome" element={<Onboarding />} />
              <Route path="/today" element={<Today />} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/path" element={<Path />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/share" element={<ShareCard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FocusProvider>
    </SceneProvider>
  )
}
