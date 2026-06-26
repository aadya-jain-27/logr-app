import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Clock, Sparkles, Pause, RefreshCw, Coffee, CloudOff, Heart } from 'lucide-react'
import { getProfile, getCachedPlan, getRawPlan, savePlan, clearPlan } from '../data/store'
import { requestPlan, todayCapacity } from '../lib/plan'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const withIds = (tasks) => tasks.map((t, i) => ({ id: `t${i}`, done: false, ...t }))
const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

// What did a previous day leave unfinished, and how long ago was it?
function carryFromPrevious() {
  const raw = getRawPlan()
  const today = new Date().toDateString()
  if (!raw || raw.date === today) return { carriedOver: [], daysAway: 0 }
  const daysAway = Math.max(1, Math.round((midnight(new Date()) - midnight(new Date(raw.date))) / 86400000))
  const carriedOver = (raw.plan?.tasks || []).filter((t) => !t.done).map((t) => t.title)
  return { carriedOver, daysAway }
}

export default function Today() {
  const profile = getProfile()
  if (!profile) return <Navigate to="/welcome" replace />

  const name = profile.name?.trim()
  const goal = profile.goal?.trim() || 'your goal'
  const cap = todayCapacity(profile)

  const [status, setStatus] = useState('loading') // loading | ready | rest | error
  const [tasks, setTasks] = useState([])
  const [meta, setMeta] = useState({ goalProgress: null, pace: null })
  const [errKind, setErrKind] = useState(null)
  const [welcomeBack, setWelcomeBack] = useState(0) // days away, 0 if none

  const generate = useCallback(async () => {
    if (cap.rest) { setStatus('rest'); return }
    const { carriedOver, daysAway } = carryFromPrevious()
    setWelcomeBack(daysAway >= 2 ? daysAway : 0)
    setStatus('loading')
    const plan = await requestPlan({
      goal: profile.goal, deadline: profile.deadline, minutesToday: cap.minutes,
      dayType: cap.dayType, material: profile.material, carriedOver, daysAway,
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    })
    if (plan && Array.isArray(plan.tasks) && plan.tasks.length && !plan.error) {
      const stored = { tasks: withIds(plan.tasks), goalProgress: plan.goalProgress ?? null, pace: plan.pace || null }
      savePlan(stored)
      setTasks(stored.tasks); setMeta({ goalProgress: stored.goalProgress, pace: stored.pace }); setStatus('ready')
    } else {
      setErrKind(plan?.error === 'no_key' ? 'no_key' : 'failed'); setStatus('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap.minutes, cap.rest, cap.dayType])

  useEffect(() => {
    if (cap.rest) { setStatus('rest'); return }
    const cached = getCachedPlan()
    if (cached?.tasks?.length) {
      setTasks(withIds(cached.tasks)); setMeta({ goalProgress: cached.goalProgress ?? null, pace: cached.pace || null }); setStatus('ready')
    } else { generate() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const replan = () => { clearPlan(); setWelcomeBack(0); generate() }

  // Persist completion so it survives a refresh (and feeds tomorrow's carry-over).
  const toggle = (id) => setTasks((ts) => {
    const next = ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    savePlan({ tasks: next, goalProgress: meta.goalProgress, pace: meta.pace })
    return next
  })

  const remaining = tasks.filter((t) => !t.done).length
  const totalMin = tasks.reduce((s, t) => s + (t.minutes || 0), 0)

  return (
    <div className="min-h-screen flex items-center justify-center lg:justify-end px-5 md:px-10 lg:px-20 pt-28 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        className="panel rounded-[32px] w-full max-w-[500px] p-8 md:p-9"
      >
        <p className="text-soft text-sm mb-1.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-3xl md:text-[2.5rem] font-medium leading-tight mb-3" style={{ color: 'var(--text)' }}>
          {greeting()}{name ? `, ${name}` : ''}.
        </h1>

        {/* Welcome back after a gap, gentle and guilt-free */}
        {status === 'ready' && welcomeBack > 0 && (
          <div className="flex items-start gap-2 mb-5 px-3.5 py-2.5 rounded-2xl" style={{ background: 'var(--chip)', border: '1px solid var(--panel-border)' }}>
            <Heart size={14} style={{ color: 'var(--primary)' }} className="mt-0.5 shrink-0" />
            <p className="text-xs" style={{ color: 'var(--text)' }}>
              Welcome back. It's been {welcomeBack} days, so today is kept light. No catching up, just a gentle restart.
            </p>
          </div>
        )}

        {status === 'rest' && (
          <div className="py-6 text-center">
            <Coffee size={28} style={{ color: 'var(--primary)' }} className="mx-auto mb-3" />
            <p className="text-[15px]" style={{ color: 'var(--text)' }}>Today is a rest day. Enjoy it, fully.</p>
            <p className="text-soft text-sm mt-1">You set weekends aside, and that matters too.</p>
          </div>
        )}

        {status === 'loading' && (
          <div className="py-8">
            <motion.p className="text-soft text-[15px] flex items-center gap-2" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
              <Sparkles size={15} style={{ color: 'var(--primary)' }} /> Shaping a calm plan for today...
            </motion.p>
            <div className="space-y-2.5 mt-5">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="chip rounded-2xl h-16" animate={{ opacity: [0.4, 0.75, 0.4] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }} />
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8 text-center">
            <CloudOff size={26} style={{ color: 'var(--text-soft)' }} className="mx-auto mb-3" />
            <p className="text-[15px]" style={{ color: 'var(--text)' }}>
              {errKind === 'no_key' ? 'Planning is not connected yet.' : "I couldn't shape today's plan just now."}
            </p>
            <p className="text-soft text-sm mt-1 mb-5">
              {errKind === 'no_key' ? 'Add a Gemini key to .env to turn on planning.' : 'It might be a brief hiccup. Try again in a moment.'}
            </p>
            <button onClick={replan} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"><RefreshCw size={14} /> Try again</button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <p className="text-soft text-[15px] mb-6 leading-relaxed">
              {remaining === 0
                ? "You've done everything for today. Rest easy."
                : <>Just <span style={{ color: 'var(--text)', fontWeight: 600 }}>{remaining} {remaining === 1 ? 'thing' : 'things'}</span> today. That's all you need to think about.</>}
            </p>

            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="chip flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full">
                <Clock size={13} /> about {Math.round((totalMin / 60) * 10) / 10}h today
              </span>
              {meta.goalProgress != null && (
                <span className="chip flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full">
                  <Sparkles size={13} style={{ color: 'var(--primary)' }} /> {meta.goalProgress}% to {goal}{meta.pace ? `, ${meta.pace}` : ''}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {tasks.map((t, i) => (
                <motion.button
                  key={t.id} onClick={() => toggle(t.id)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: t.done ? 0.55 : 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.07, duration: 0.5 }} whileTap={{ scale: 0.98 }}
                  className="chip w-full text-left rounded-2xl p-4 flex items-start gap-3.5"
                >
                  <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                    style={{ background: t.done ? 'var(--primary)' : 'transparent', border: t.done ? 'none' : '2px solid var(--text-soft)', color: 'var(--on-primary)' }}>
                    {t.done && <Check size={14} strokeWidth={3} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
                    <div className="text-soft text-xs mt-0.5">{t.kind}{t.source ? `, ${t.source}` : ''}</div>
                  </div>
                  <span className="shrink-0 text-xs self-center" style={{ color: 'var(--text-soft)' }}>{t.minutes}m</span>
                </motion.button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-5 text-sm text-soft">
              <button className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"><Pause size={14} /> Break</button>
              <span style={{ opacity: 0.35 }}>·</span>
              <button onClick={replan} className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"><RefreshCw size={14} /> Re-plan</button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
