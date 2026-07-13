import { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, Sparkles, Timer, RefreshCw, Coffee, CloudOff, Heart, Settings, AlertTriangle, ChevronDown, Share2, Compass, Plus, X } from 'lucide-react'
import { getProfile, getCachedPlan, getRawPlan, savePlan, clearPlan, getYesterdayPlan, getValidRoadmap, saveRoadmap, pathDay, getExtras, addExtra, saveExtras, getCovered } from '../data/store'
import { requestPlan, requestRoadmap, todayCapacity } from '../lib/plan'
import { useFocus } from '../focus'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Guard against the model repeating a task: keep the first of each title.
const dedupeTasks = (tasks) => {
  const seen = new Set()
  return (tasks || []).filter((t) => {
    const k = (t.title || '').trim().toLowerCase()
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })
}
const withIds = (tasks) => dedupeTasks(tasks).map((t, i) => ({ id: `t${i}`, done: false, ...t }))
const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

function carryFromPrevious() {
  const raw = getRawPlan()
  const today = new Date().toDateString()
  if (!raw || raw.date === today) return { carriedOver: [], daysAway: 0 }
  const daysAway = Math.max(1, Math.round((midnight(new Date()) - midnight(new Date(raw.date))) / 86400000))
  const carriedOver = (raw.plan?.tasks || []).filter((t) => !t.done).map((t) => t.title)
  return { carriedOver, daysAway }
}

export default function Today() {
  // All hooks MUST come before any conditional returns.
  const { open: openFocus } = useFocus()

  const profile = getProfile()
  const name = profile?.name?.trim()
  const goal = profile?.goal?.trim() || 'your goal'
  const cap = profile ? todayCapacity(profile) : { minutes: 0, rest: false, dayType: '' }

  const [status, setStatus] = useState('loading')
  const [caughtUp, setCaughtUp] = useState(false)
  const [tasks, setTasks] = useState([])
  const [meta, setMeta] = useState({ goalProgress: null, pace: null, acknowledgements: [] })
  const [errKind, setErrKind] = useState(null)
  const [welcomeBack, setWelcomeBack] = useState(0)
  const [confirmReplan, setConfirmReplan] = useState(false)
  const [fallbackTasks, setFallbackTasks] = useState([])
  const [expandedTips, setExpandedTips] = useState(new Set())
  const [carriedTasks, setCarriedTasks] = useState([])
  const [path, setPath] = useState(() => pathDay(profile))
  const [extras, setExtras] = useState(() => getExtras())
  const [newExtra, setNewExtra] = useState('')
  const loadedDateRef = useRef(new Date().toDateString())

  const generate = useCallback(async () => {
    if (!profile) return
    if (cap.rest) { setStatus('rest'); return }
    const { carriedOver, daysAway } = carryFromPrevious()
    setWelcomeBack(daysAway >= 2 ? daysAway : 0)
    setCarriedTasks(carriedOver)
    setStatus('loading')
    const todayStr = new Date().toDateString()
    const todaysCommitments = (profile.commitments || [])
      .filter((c) => c.date && new Date(c.date + 'T00:00:00').toDateString() === todayStr)
      .map((c) => ({ name: c.name, type: c.type }))
    // On a day with an exam or deadline, actually cut the study budget so today is genuinely lighter.
    const minutesToday = todaysCommitments.length ? Math.max(30, Math.round(cap.minutes / 2)) : cap.minutes
    const plan = await requestPlan({
      goal: profile.goal, deadline: profile.deadline, minutesToday,
      dayType: cap.dayType, resources: profile.resources, carriedOver, daysAway, todaysCommitments,
      covered: getCovered(),
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    })
    if (plan && !plan.error && Array.isArray(plan.tasks) && plan.tasks.length) {
      const stored = { tasks: withIds(plan.tasks), goalProgress: plan.goalProgress ?? null, pace: plan.pace || null, acknowledgements: Array.isArray(plan.acknowledgements) ? plan.acknowledgements : [] }
      savePlan(stored)
      setCaughtUp(false)
      setTasks(stored.tasks)
      setMeta({ goalProgress: stored.goalProgress, pace: stored.pace, acknowledgements: stored.acknowledgements })
      setStatus('ready')
    } else if (plan && !plan.error && plan.caughtUp) {
      // Nothing genuinely new left in the student's resources. Cache this so we don't re-ask
      // every visit, and invite them to add more rather than repeating finished work.
      const stored = { tasks: [], caughtUp: true, goalProgress: plan.goalProgress ?? null, pace: null, acknowledgements: [] }
      savePlan(stored)
      setCaughtUp(true)
      setTasks([])
      setMeta({ goalProgress: stored.goalProgress, pace: null, acknowledgements: [] })
      setStatus('ready')
    } else {
      setErrKind(plan?.error === 'no_key' ? 'no_key' : 'failed')
      const yp = getYesterdayPlan()
      if (yp?.tasks?.length) setFallbackTasks(withIds(yp.tasks))
      setStatus('error')
    }
  }, [cap.minutes, cap.rest, cap.dayType, profile])

  useEffect(() => {
    if (!profile) return
    if (cap.rest) { setStatus('rest'); return }
    const cached = getCachedPlan()
    const cachedMinutes = (cached?.tasks || []).reduce((s, t) => s + (t.minutes || 0), 0)
    if (cached?.caughtUp) {
      setCaughtUp(true)
      setTasks([])
      setMeta({ goalProgress: cached.goalProgress ?? null, pace: null, acknowledgements: [] })
      setStatus('ready')
    } else if (cached?.tasks?.length && cachedMinutes > 0) {
      setTasks(withIds(cached.tasks))
      setMeta({ goalProgress: cached.goalProgress ?? null, pace: cached.pace || null, acknowledgements: Array.isArray(cached.acknowledgements) ? cached.acknowledgements : [] })
      setStatus('ready')
    } else { generate() } // no cache, or a broken zero minute plan, so replan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If the tab was left open past midnight, notice the new day on return and shape a fresh plan.
  useEffect(() => {
    if (!profile) return
    const check = () => {
      const today = new Date().toDateString()
      if (today !== loadedDateRef.current && !cap.rest) {
        loadedDateRef.current = today
        generate()
      }
    }
    window.addEventListener('focus', check)
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    return () => { window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', onVis) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, cap.rest])

  // Quietly shape the overall path once, so "day N" and the path view are ready to glance at.
  useEffect(() => {
    if (!profile || status !== 'ready') return
    if (getValidRoadmap(profile)) { setPath(pathDay(profile)); return }
    let cancelled = false
    requestRoadmap({
      goal: profile.goal, deadline: profile.deadline,
      weekdayHours: profile.weekday, weekendHours: profile.weekend, resources: profile.resources,
    }).then((r) => {
      if (cancelled || !r || !Array.isArray(r.phases) || !r.phases.length || r.error) return
      saveRoadmap(profile, r)
      setPath(pathDay(profile))
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // NOW it's safe to conditionally return — all hooks are above this line.
  if (!profile) return <Navigate to="/welcome" replace />

  const replan = () => {
    setConfirmReplan(false)
    clearPlan()
    setWelcomeBack(0)
    setFallbackTasks([])
    generate()
  }

  const toggle = (id) => setTasks((ts) => {
    const next = ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    savePlan({ tasks: next, goalProgress: meta.goalProgress, pace: meta.pace, acknowledgements: meta.acknowledgements })
    return next
  })

  // Your own additions for today, stored separately so re-planning never wipes them.
  const addExtraTask = () => {
    const title = newExtra.trim()
    if (!title) return
    setExtras(addExtra(title))
    setNewExtra('')
  }
  const toggleExtra = (id) => setExtras((xs) => { const next = xs.map((x) => (x.id === id ? { ...x, done: !x.done } : x)); saveExtras(next); return next })
  const removeExtra = (id) => setExtras((xs) => { const next = xs.filter((x) => x.id !== id); saveExtras(next); return next })

  const remaining = tasks.filter((t) => !t.done).length + extras.filter((x) => !x.done).length
  const totalMin = tasks.reduce((s, t) => s + (t.minutes || 0), 0) + extras.reduce((s, x) => s + (x.minutes || 0), 0)

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

        {status === 'ready' && welcomeBack > 0 && (
          <div className="mb-5 px-3.5 py-3 rounded-2xl" style={{ background: 'var(--chip)', border: '1px solid var(--panel-border)' }}>
            <div className="flex items-start gap-2">
              <Heart size={14} style={{ color: 'var(--primary)' }} className="mt-0.5 shrink-0" />
              <p className="text-xs" style={{ color: 'var(--text)' }}>
                Welcome back. It's been {welcomeBack} {welcomeBack === 1 ? 'day' : 'days'}, so today is kept light.
              </p>
            </div>
            {carriedTasks.length > 0 && (
              <div className="mt-2 ml-5 space-y-1">
                <p className="text-xs text-soft">Rolled over from before:</p>
                {carriedTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-soft)' }}>
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--primary)', opacity: 0.5 }} />
                    {t}
                  </div>
                ))}
              </div>
            )}
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
          <div className="py-6">
            <div className="text-center mb-4">
              <CloudOff size={26} style={{ color: 'var(--text-soft)' }} className="mx-auto mb-3" />
              <p className="text-[15px]" style={{ color: 'var(--text)' }}>
                {errKind === 'no_key' ? 'Planning is not connected yet.' : "Couldn't reach Gemini right now."}
              </p>
              <p className="text-soft text-sm mt-1 mb-4">
                {errKind === 'no_key' ? 'Add a Gemini key to .env to turn on planning.' : 'It might be a brief hiccup. Try again in a moment.'}
              </p>
              <button onClick={generate} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"><RefreshCw size={14} /> Try again</button>
            </div>
            {fallbackTasks.length > 0 && (
              <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--panel-border)' }}>
                <div className="flex items-center gap-1.5 text-xs text-soft mb-3">
                  <AlertTriangle size={12} /> Showing your previous plan while offline
                </div>
                <div className="space-y-2">
                  {fallbackTasks.map((t) => (
                    <div key={t.id} className="chip rounded-xl p-3 flex items-start gap-3 opacity-70">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t.title}</div>
                        <div className="text-soft text-xs mt-0.5">{t.kind}{t.source && !/^https?:\/\//.test(t.source) ? `, ${t.source}` : ''}</div>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: 'var(--text-soft)' }}>{t.minutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'ready' && (
          <>
            {caughtUp ? (
              <div className="mb-2 px-4 py-6 rounded-2xl text-center" style={{ background: 'var(--chip)', border: '1px solid var(--panel-border)' }}>
                <Sparkles size={26} style={{ color: 'var(--primary)' }} className="mx-auto mb-3" />
                <p className="text-[15px] font-medium" style={{ color: 'var(--text)' }}>You've worked through everything you gave me for now.</p>
                <p className="text-soft text-sm mt-1.5 mb-4 max-w-xs mx-auto">Add your next resource or goal in Settings and I'll keep the path going, with no repeats.</p>
                <Link to="/settings" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"><Settings size={14} /> Open Settings</Link>
              </div>
            ) : (
            <>
            <p className="text-soft text-[15px] mb-6 leading-relaxed">
              {remaining === 0
                ? "You've done everything for today. Rest easy."
                : <>Just <span style={{ color: 'var(--text)', fontWeight: 600 }}>{remaining} {remaining === 1 ? 'thing' : 'things'}</span> today. That's all you need to think about.</>}
            </p>

            {/* Confirm the student's pacing requests were honored, so they know they were heard. */}
            {meta.acknowledgements?.length > 0 && (
              <div className="space-y-1.5 mb-5">
                {meta.acknowledgements.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-soft)' }}>
                    <Check size={13} style={{ color: 'var(--primary)' }} className="mt-0.5 shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="chip flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full">
                <Clock size={13} /> about {Math.round((totalMin / 60) * 10) / 10}h today
              </span>
              {meta.goalProgress != null && (
                <span className="chip flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full">
                  <Sparkles size={13} style={{ color: 'var(--primary)' }} /> {meta.goalProgress}% to {goal}{meta.pace ? `, ${meta.pace}` : ''}
                </span>
              )}
              {path && (
                <Link to="/path" className="chip flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity" title="See the whole path">
                  <Compass size={13} style={{ color: 'var(--primary)' }} /> Day {path.day}{path.total ? ` of ${path.total}` : ''}
                </Link>
              )}
            </div>

            <div className="space-y-2.5">
              {tasks.map((t, i) => (
                // div instead of button to allow nested <a> tags without HTML violations
                <motion.div
                  key={t.id}
                  role="button" tabIndex={0}
                  onClick={() => toggle(t.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(t.id)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: t.done ? 0.55 : 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.07, duration: 0.5 }}
                  whileTap={{ scale: 0.98 }}
                  className="chip w-full text-left rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer"
                  style={{ userSelect: 'none' }}
                >
                  <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                    style={{ background: t.done ? 'var(--primary)' : 'transparent', border: t.done ? 'none' : '2px solid var(--text-soft)', color: 'var(--on-primary)' }}>
                    {t.done && <Check size={14} strokeWidth={3} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
                    <div className="text-soft text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {t.kind}
                      {t.source && (/^https?:\/\//.test(t.source) ? (
                        <a href={t.source} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="underline hover:opacity-75 transition-opacity"
                          style={{ color: 'var(--primary)' }}>
                          {/youtu/.test(t.source) ? 'Open in YouTube' : 'Open link'}
                        </a>
                      ) : `, ${t.source}`)}
                    </div>
                    {t.tip && (
                      <div className="mt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedTips((prev) => { const next = new Set(prev); next.has(t.id) ? next.delete(t.id) : next.add(t.id); return next }) }}
                          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-75"
                          style={{ color: 'var(--primary)' }}
                        >
                          <ChevronDown size={12} style={{ transform: expandedTips.has(t.id) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                          Where to start
                        </button>
                        <AnimatePresence>
                          {expandedTips.has(t.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.22 }}
                              className="overflow-hidden"
                            >
                              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-soft)' }}>{t.tip}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs self-center" style={{ color: 'var(--text-soft)' }}>{t.minutes}m</span>
                </motion.div>
              ))}
            </div>
            </>
            )}

            {/* Your own additions for today, kept even when the AI plan re-plans */}
            {extras.length > 0 && (
              <div className="space-y-2.5 mt-2.5">
                {extras.map((x) => (
                  <div key={x.id} role="button" tabIndex={0}
                    onClick={() => toggleExtra(x.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExtra(x.id)}
                    className="chip w-full text-left rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer"
                    style={{ userSelect: 'none', opacity: x.done ? 0.55 : 1 }}>
                    <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                      style={{ background: x.done ? 'var(--primary)' : 'transparent', border: x.done ? 'none' : '2px solid var(--text-soft)', color: 'var(--on-primary)' }}>
                      {x.done && <Check size={14} strokeWidth={3} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--text)', textDecoration: x.done ? 'line-through' : 'none' }}>{x.title}</div>
                      <div className="text-soft text-xs mt-0.5">Added by you</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeExtra(x.id) }} className="shrink-0 self-center hover:opacity-75 transition-opacity" style={{ color: 'var(--text-soft)' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <input
                value={newExtra} onChange={(e) => setNewExtra(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExtraTask()}
                placeholder="Add something of your own for today"
                className="flex-1 px-3.5 py-2.5 rounded-2xl text-sm outline-none"
                style={{ background: 'var(--chip)', border: '1px solid var(--panel-border)', color: 'var(--text)' }}
              />
              <button onClick={addExtraTask} className="btn-primary w-10 h-10 rounded-full flex items-center justify-center shrink-0" title="Add to today"><Plus size={16} /></button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-soft flex-wrap">
              <button
                onClick={() => openFocus()}
                className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
              >
                <Timer size={14} /> Focus
              </button>
              <span style={{ opacity: 0.35 }}>·</span>
              <AnimatePresence mode="wait">
                {confirmReplan ? (
                  <motion.span key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2">
                    <span style={{ color: 'var(--text)' }}>Clear today's progress?</span>
                    <button onClick={replan} className="underline" style={{ color: 'var(--primary)' }}>Yes</button>
                    <button onClick={() => setConfirmReplan(false)} className="underline">Cancel</button>
                  </motion.span>
                ) : (
                  <motion.button key="replan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setConfirmReplan(true)}
                    className="flex items-center gap-1.5 hover:opacity-75 transition-opacity">
                    <RefreshCw size={14} /> Re-plan
                  </motion.button>
                )}
              </AnimatePresence>
              <span style={{ opacity: 0.35 }}>·</span>
              <Link to="/share" className="flex items-center gap-1.5 hover:opacity-75 transition-opacity">
                <Share2 size={14} /> Share
              </Link>
              <span style={{ opacity: 0.35 }}>·</span>
              <Link to="/settings" className="flex items-center gap-1.5 hover:opacity-75 transition-opacity">
                <Settings size={14} /> Settings
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
