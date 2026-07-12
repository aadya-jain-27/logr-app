import { Link } from 'react-router-dom'
import { Sprout, Volume2, VolumeX, CalendarHeart, CalendarDays, Settings, Compass } from 'lucide-react'
import { useScene } from '../theme'
import { useSound } from '../sound'
import { SCENES, getScene } from '../scenes/scenes'

export default function TopBar() {
  const { scene, setScene } = useScene()
  const { soundOn, toggleSound, volume, setVolume } = useSound()
  const active = getScene(scene)

  return (
    <header className="fixed top-0 inset-x-0 z-30">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
              <Sprout size={17} strokeWidth={2.2} />
            </span>
            <span className="text-xl" style={{ fontFamily: 'Fraunces, serif', color: 'var(--text)', fontWeight: 600 }}>Logr</span>
          </div>
          <span className="text-xs mt-1 ml-0.5" style={{ color: 'var(--text-soft)', fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}>{active.name}</span>
        </div>

        {/* Scene switcher + sound */}
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Scene switcher is hidden on small screens to keep nav and settings reachable; worlds are also switchable in Settings. */}
          <div className="panel hidden sm:flex items-center gap-2.5 px-3 py-2.5 rounded-full">
            {SCENES.map((s) => {
              const on = s.id === scene
              return (
                <button
                  key={s.id} onClick={() => setScene(s.id)} title={s.name} aria-label={s.name}
                  className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                  style={{ background: s.swatch, boxShadow: on ? '0 0 0 2px var(--panel), 0 0 0 3.5px var(--text)' : 'inset 0 0 0 1px rgba(0,0,0,0.12)' }}
                />
              )
            })}
          </div>
          <Link
            to="/path" title="The path"
            className="panel w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            style={{ color: 'var(--text)' }}
          >
            <Compass size={16} />
          </Link>
          <Link
            to="/plan" title="Your plan on a calendar"
            className="panel w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            style={{ color: 'var(--text)' }}
          >
            <CalendarDays size={16} />
          </Link>
          <Link
            to="/journey" title="Your progress"
            className="panel w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            style={{ color: 'var(--text)' }}
          >
            <CalendarHeart size={16} />
          </Link>
          <Link
            to="/settings" title="Settings"
            className="panel w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            style={{ color: 'var(--text)' }}
          >
            <Settings size={16} />
          </Link>
          {soundOn && (
            <div className="panel rounded-full px-3.5 h-10 flex items-center">
              <input type="range" min="0" max="1" step="0.01" value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Ambient volume" title="Volume"
                className="w-20 cursor-pointer" style={{ accentColor: 'var(--primary)' }} />
            </div>
          )}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Mute ambient sound' : 'Play ambient sound'}
            className="panel w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            style={{ color: soundOn ? 'var(--primary)' : 'var(--text)' }}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}
