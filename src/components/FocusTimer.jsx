import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, X, Coffee, Brain, Check } from 'lucide-react'
import { useFocus } from '../focus'
import { logFocus } from '../data/store'

const PRESETS = [{ f: 25, b: 5, label: '25 / 5' }, { f: 50, b: 10, label: '50 / 10' }]

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [528, 660, 792]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.22
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.18, start + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.1)
      osc.start(start); osc.stop(start + 1.1)
    })
  } catch { /* audio not available */ }
}

export default function FocusTimer() {
  const { isOpen, close } = useFocus()
  const [preset, setPreset] = useState(0) // -1 = custom
  const [custom, setCustom] = useState({ f: '', b: '' })
  const [editingCustom, setEditingCustom] = useState(false)
  const [mode, setMode] = useState('focus')
  const [secs, setSecs] = useState(PRESETS[0].f * 60)
  const [running, setRunning] = useState(false)
  const [cycles, setCycles] = useState(0)
  const tick = useRef()
  const endRef = useRef(0) // timestamp when the current phase ends
  const focusStart = useRef(0) // timestamp the current focus run began, flushed as minutes when it stops

  const activeDurations = preset === -1
    ? { f: Math.max(1, parseInt(custom.f) || 25), b: Math.max(1, parseInt(custom.b) || 5) }
    : { f: PRESETS[preset].f, b: PRESETS[preset].b }

  useEffect(() => {
    if (isOpen) { setMode('focus'); setSecs(activeDurations.f * 60); setCycles(0); setRunning(false) }
    else setRunning(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Timestamp based so it stays accurate when the tab is in the background, where setInterval is throttled.
  useEffect(() => {
    if (!running) return
    const step = () => {
      const remaining = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      if (remaining <= 0) {
        playChime()
        if (mode === 'focus') { setCycles((c) => c + 1); endRef.current = Date.now() + activeDurations.b * 60 * 1000; setMode('break'); setSecs(activeDurations.b * 60) }
        else { endRef.current = Date.now() + activeDurations.f * 60 * 1000; setMode('focus'); setSecs(activeDurations.f * 60) }
      } else {
        setSecs(remaining)
      }
    }
    tick.current = setInterval(step, 500)
    const onVisible = () => { if (document.visibilityState === 'visible') step() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(tick.current); document.removeEventListener('visibilitychange', onVisible) }
    // activeDurations is derived from preset and custom, which are already dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode, preset, custom])

  // Log focused time as it is actually spent: a run starts whenever focus is running, and when
  // that run ends (pause, reset, close, or the phase completing) the minutes elapsed are recorded.
  // This counts partial sessions, not only full ones.
  useEffect(() => {
    if (running && mode === 'focus') {
      focusStart.current = Date.now()
      return () => {
        if (focusStart.current) {
          logFocus((Date.now() - focusStart.current) / 60000)
          focusStart.current = 0
        }
      }
    }
  }, [running, mode])

  if (!isOpen) return null

  const total = (mode === 'focus' ? activeDurations.f : activeDurations.b) * 60
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const R = 46, C = 2 * Math.PI * R
  const offset = C * (secs / total)

  const choosePreset = (i) => { setPreset(i); setEditingCustom(false); setMode('focus'); setSecs(PRESETS[i].f * 60); setRunning(false) }
  const applyCustom = () => {
    const f = Math.max(1, parseInt(custom.f) || 25)
    const b = Math.max(1, parseInt(custom.b) || 5)
    setCustom({ f: String(f), b: String(b) })
    setPreset(-1); setEditingCustom(false); setMode('focus'); setSecs(f * 60); setRunning(false)
  }
  const reset = () => { setMode('focus'); setSecs(activeDurations.f * 60); setRunning(false) }
  const togglePlay = () => setRunning((r) => { if (!r) endRef.current = Date.now() + secs * 1000; return !r })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.94 }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        className="panel fixed z-40 bottom-6 left-6 rounded-[28px] p-5 w-[260px]"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text)' }}>
            {mode === 'focus' ? <Brain size={14} style={{ color: 'var(--primary)' }} /> : <Coffee size={14} style={{ color: 'var(--primary)' }} />}
            {mode === 'focus' ? 'Focus' : 'Breathe a little'}
          </span>
          <button onClick={close} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--text-soft)' }}><X size={15} /></button>
        </div>

        <div className="relative w-[120px] h-[120px] mx-auto mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r={R} fill="none" stroke="var(--panel-border)" strokeWidth="6" />
            <circle cx="55" cy="55" r={R} fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Fraunces, serif' }}>
            {mm}:{ss}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2.5 mb-4">
          <button onClick={togglePlay} className="btn-primary w-11 h-11 rounded-full flex items-center justify-center">
            {running ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: 1 }} />}
          </button>
          <button onClick={reset} className="w-11 h-11 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ border: '1px solid var(--panel-border)', color: 'var(--text)' }}>
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="flex gap-1.5 justify-center mb-2">
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => choosePreset(i)} className="text-xs px-2.5 py-1 rounded-full transition-colors"
              style={{ background: i === preset ? 'var(--primary)' : 'var(--chip)', color: i === preset ? 'var(--on-primary)' : 'var(--text-soft)', border: '1px solid var(--panel-border)' }}>
              {p.label}
            </button>
          ))}
          <button onClick={() => { setEditingCustom((v) => !v); setPreset(-1) }} className="text-xs px-2.5 py-1 rounded-full transition-colors"
            style={{ background: preset === -1 ? 'var(--primary)' : 'var(--chip)', color: preset === -1 ? 'var(--on-primary)' : 'var(--text-soft)', border: '1px solid var(--panel-border)' }}>
            Custom
          </button>
        </div>

        <AnimatePresence>
          {editingCustom && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex-1">
                  <div className="text-xs text-soft mb-1 text-center">Study (min)</div>
                  <input type="number" min="1" max="120" className="field w-full px-2 py-1.5 text-sm outline-none text-center"
                    placeholder="25" value={custom.f} onChange={(e) => setCustom({ ...custom, f: e.target.value })} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-soft mb-1 text-center">Break (min)</div>
                  <input type="number" min="1" max="60" className="field w-full px-2 py-1.5 text-sm outline-none text-center"
                    placeholder="5" value={custom.b} onChange={(e) => setCustom({ ...custom, b: e.target.value })} />
                </div>
                <button onClick={applyCustom} className="btn-primary w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-4">
                  <Check size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {cycles > 0 && <div className="text-center text-xs text-soft mt-3">{cycles} focus {cycles === 1 ? 'session' : 'sessions'} done</div>}
      </motion.div>
    </AnimatePresence>
  )
}
