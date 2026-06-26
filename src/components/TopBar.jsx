import { useState } from 'react'
import { Sprout, Volume2, VolumeX } from 'lucide-react'
import { useScene } from '../theme'
import { SCENES, getScene } from '../scenes/scenes'

export default function TopBar() {
  const { scene, setScene } = useScene()
  const [sound, setSound] = useState(false)
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
        <div className="flex items-center gap-3">
          <div className="panel flex items-center gap-2.5 px-3 py-2.5 rounded-full">
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
          <button
            onClick={() => setSound((v) => !v)}
            title="Ambient sound (coming soon, add audio files to enable)"
            className="panel w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            style={{ color: 'var(--text)' }}
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}
