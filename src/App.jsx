import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { SceneProvider, useScene } from './theme'
import Scene from './scenes/Scene'
import TopBar from './components/TopBar'
import Today from './screens/Today'
import Onboarding from './screens/Onboarding'
import Journey from './screens/Journey'
import { isOnboarded } from './data/store'

function Shell() {
  const { scene } = useScene()
  return (
    <div className="min-h-screen relative">
      {/* The living world — always behind everything */}
      <div className="fixed inset-0 z-0">
        <Scene id={scene} />
      </div>
      <TopBar />
      <main className="relative z-10 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <SceneProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Navigate to={isOnboarded() ? '/today' : '/welcome'} replace />} />
            <Route path="/welcome" element={<Onboarding />} />
            <Route path="/today" element={<Today />} />
            <Route path="/journey" element={<Journey />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SceneProvider>
  )
}
