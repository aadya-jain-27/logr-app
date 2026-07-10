import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Check, Clock, Sparkles, X } from 'lucide-react'
import { getCachedPlan, getProfile } from '../data/store'

export default function ShareCard() {
  const navigate = useNavigate()
  const cardRef = useRef()
  const profile = getProfile()
  const cached = getCachedPlan()

  useEffect(() => {
    if (!cached?.tasks?.length) navigate('/today')
  }, [cached, navigate])

  if (!cached?.tasks?.length) return null

  const tasks = cached.tasks
  const remaining = tasks.filter((t) => !t.done).length
  const done = tasks.filter((t) => t.done).length
  const totalMin = tasks.reduce((s, t) => s + (t.minutes || 0), 0)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 pt-20 pb-10">
      {/* Close button, portaled to body so the top bar's stacking context can't intercept the click */}
      {createPortal(
        <button onClick={() => navigate('/today')}
          className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full flex items-center justify-center panel hover:opacity-75 transition-opacity"
          style={{ color: 'var(--text)' }} aria-label="Back to today">
          <X size={16} />
        </button>,
        document.body,
      )}

      <p className="text-soft text-sm mb-4">Screenshot this to share your plan</p>

      {/* The card — clean, no controls */}
      <div ref={cardRef}
        className="panel rounded-[32px] w-full max-w-[420px] p-8 relative overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>

        {/* Subtle top accent */}
        <div className="absolute top-0 inset-x-0 h-1 rounded-t-[32px]" style={{ background: 'var(--primary)' }} />

        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-soft mb-1">{today}</p>
            <p className="text-lg font-semibold" style={{ color: 'var(--text)', fontFamily: 'Fraunces, serif' }}>
              {profile?.name ? `${profile.name}'s plan` : "Today's plan"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="chip flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full">
              <Clock size={11} /> {Math.round((totalMin / 60) * 10) / 10}h
            </span>
            {cached.goalProgress != null && (
              <span className="chip flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full">
                <Sparkles size={11} style={{ color: 'var(--primary)' }} /> {cached.goalProgress}%
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {tasks.map((t, i) => (
            <div key={i} className="chip rounded-xl p-3.5 flex items-start gap-3"
              style={{ opacity: t.done ? 0.55 : 1 }}>
              <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: t.done ? 'var(--primary)' : 'transparent', border: t.done ? 'none' : '2px solid var(--text-soft)', color: 'var(--on-primary)' }}>
                {t.done && <Check size={11} strokeWidth={3} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
                <div className="text-soft text-xs mt-0.5">{t.kind}{t.source && !/^https?:\/\//.test(t.source) ? `, ${t.source}` : ''}</div>
              </div>
              <span className="text-xs shrink-0 self-center" style={{ color: 'var(--text-soft)' }}>{t.minutes}m</span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--panel-border)' }}>
          <span className="text-xs text-soft">
            {done === tasks.length ? 'All done.' : `${remaining} left`}
            {cached.pace ? ` · ${cached.pace}` : ''}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--primary)', fontFamily: 'Fraunces, serif' }}>Logr</span>
        </div>
      </div>

      <p className="text-xs text-soft mt-5 text-center">
        Use your browser's screenshot tool or <span className="underline cursor-pointer" onClick={() => window.print()}>print to PDF</span>
      </p>
    </div>
  )
}
