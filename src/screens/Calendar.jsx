import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CalendarDays, Sparkles, CloudOff, RefreshCw, ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { getProfile, getValidRoadmap, saveRoadmap, getExtras } from '../data/store'
import { requestRoadmap } from '../lib/plan'

// Soft, calm palette so each phase reads as its own gentle band across the calendar.
const PHASE_COLORS = ['#9DBEE0', '#9FD3B8', '#F0C987', '#E8A9A9', '#C9A9E0', '#8FCFD1', '#E3B7D0']
const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const sameDay = (a, b) => atMidnight(a) === atMidnight(b)
const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function Calendar() {
  const profile = getProfile()

  const [status, setStatus] = useState('loading') // loading | ready | error
  const [record, setRecord] = useState(null)
  const [errKind, setErrKind] = useState(null)
  const [view, setView] = useState('month') // month | week
  const [monthOffset, setMonthOffset] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selected, setSelected] = useState(null) // a Date the user tapped in month view

  const generate = async () => {
    if (!profile) return
    setStatus('loading')
    const r = await requestRoadmap({
      goal: profile.goal, deadline: profile.deadline,
      weekdayHours: profile.weekday, weekendHours: profile.weekend, resources: profile.resources,
    })
    if (r && Array.isArray(r.phases) && r.phases.length && !r.error) {
      setRecord(saveRoadmap(profile, r)); setStatus('ready')
    } else {
      setErrKind(r?.error === 'no_key' ? 'no_key' : 'failed'); setStatus('error')
    }
  }

  useEffect(() => {
    if (!profile) return
    const cached = getValidRoadmap(profile)
    if (cached) { setRecord(cached); setStatus('ready') } else { generate() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!profile) return <Navigate to="/welcome" replace />

  const roadmap = record?.roadmap
  const phases = roadmap?.phases || []
  const schedule = roadmap?.schedule || []
  const startDate = record ? new Date(record.startDate) : new Date()
  const totalDays = Number(roadmap?.totalDays) || (phases.length ? phases[phases.length - 1].dayEnd : 0)
  const endDate = addDays(startDate, Math.max(0, totalDays - 1))
  const skipWeekends = profile.skipWeekends ?? profile.skipWeekend ?? false
  const commitments = (profile.commitments || []).filter((c) => c.date)

  const dayNumber = (date) => Math.floor((atMidnight(date) - atMidnight(startDate)) / 86400000) + 1
  const phaseIndexFor = (n) => phases.findIndex((p) => n >= p.dayStart && n <= p.dayEnd)
  const isRest = (date) => skipWeekends && (date.getDay() === 0 || date.getDay() === 6)
  const commitsOn = (date) => commitments.filter((c) => sameDay(new Date(c.date + 'T00:00:00'), date))
  const extrasOn = (date) => getExtras(date.toDateString())
  // A resource the student paced (e.g. "divide across 2 weeks") shows on every day of its span.
  const scheduledOn = (n) => schedule.filter((s) => s && n >= s.dayStart && n <= s.dayEnd)
  const scribble = (n, pIdx) => {
    const sched = scheduledOn(n)
    if (sched.length) {
      return sched.map((s) => {
        const total = s.dayEnd - s.dayStart + 1
        return total > 1 ? `${s.resource} (day ${n - s.dayStart + 1} of ${total})` : s.resource
      }).join(', ')
    }
    // On days with no specific resource scheduled, show the phase's theme rather than
    // recycling resource names day after day (which read as repetition). Your own materials
    // appear only on their real days above; the rest of a phase shows what it is building.
    const p = phases[pIdx]
    if (!p) return ''
    return p.focus || p.title || ''
  }

  const today = new Date()
  const shortName = (s) => (s || '').length > 22 ? (s || '').slice(0, 21) + '…' : s

  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="panel rounded-[32px] w-full max-w-[620px] p-7 md:p-9 max-h-[86vh] overflow-y-auto"
      >
        <Link to="/today" className="flex items-center gap-1.5 text-sm text-soft hover:opacity-75 transition-opacity mb-5">
          <ArrowLeft size={15} /> Back to today
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={15} style={{ color: 'var(--primary)' }} />
          <p className="text-soft text-sm">Your plan, day by day</p>
        </div>
        <h1 className="text-2xl md:text-[1.9rem] font-medium leading-tight mb-2" style={{ color: 'var(--text)' }}>
          {profile.goal?.trim() || 'Your plan'}
        </h1>

        {status === 'loading' && (
          <div className="py-8">
            <motion.p className="text-soft text-[15px] flex items-center gap-2" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
              <Sparkles size={15} style={{ color: 'var(--primary)' }} /> Laying your plan across the calendar...
            </motion.p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8 text-center">
            <CloudOff size={26} style={{ color: 'var(--text-soft)' }} className="mx-auto mb-3" />
            <p className="text-[15px]" style={{ color: 'var(--text)' }}>
              {errKind === 'no_key' ? 'Planning is not connected yet.' : "I couldn't build the calendar just now."}
            </p>
            <button onClick={generate} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mt-4"><RefreshCw size={14} /> Try again</button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <p className="text-soft text-sm mb-5">
              Your path runs from {fmtDate(startDate)} to <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fmtDate(endDate)}</span>. Everything you gave me is spread across it, so it fits.
            </p>

            {/* view toggle */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1 p-1 rounded-2xl w-fit" style={{ background: 'var(--chip)', border: '1px solid var(--panel-border)' }}>
                {['month', 'week'].map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className="px-4 py-1.5 rounded-xl text-xs font-medium capitalize transition-all"
                    style={{ background: view === v ? 'var(--primary)' : 'transparent', color: view === v ? 'var(--on-primary)' : 'var(--text-soft)' }}>
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => (view === 'month' ? setMonthOffset((o) => o - 1) : setWeekOffset((o) => o - 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity" style={{ border: '1px solid var(--panel-border)', color: 'var(--text)' }}>
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => (view === 'month' ? setMonthOffset((o) => o + 1) : setWeekOffset((o) => o + 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity" style={{ border: '1px solid var(--panel-border)', color: 'var(--text)' }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {view === 'month' ? (
                <MonthView key={'m' + monthOffset}
                  base={new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)}
                  {...{ today, dayNumber, phaseIndexFor, isRest, commitsOn, extrasOn, scribble, totalDays, selected, setSelected }} />
              ) : (
                <WeekView key={'w' + weekOffset}
                  weekStart={addDays(addDays(today, -today.getDay()), weekOffset * 7)}
                  {...{ today, dayNumber, phaseIndexFor, isRest, commitsOn, extrasOn, scribble, totalDays }} />
              )}
            </AnimatePresence>

            {/* phase legend */}
            {phases.length > 0 && (
              <div className="mt-6 pt-5 flex flex-wrap gap-x-4 gap-y-2" style={{ borderTop: '1px solid var(--panel-border)' }}>
                {phases.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-soft)' }}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PHASE_COLORS[i % PHASE_COLORS.length] }} />
                    {shortName(p.title)}
                  </div>
                ))}
              </div>
            )}

            <p className="text-soft text-xs text-center mt-5" style={{ opacity: 0.85 }}>
              This is the plan, not a promise you must keep perfectly. Miss a day and Logr gently reshuffles the rest.
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}

function MonthView({ base, today, dayNumber, phaseIndexFor, isRest, commitsOn, extrasOn, scribble, totalDays, selected, setSelected }) {
  const year = base.getFullYear(), month = base.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selInfo = (() => {
    if (!selected || selected.getMonth() !== month) return null
    const n = dayNumber(selected)
    const pIdx = phaseIndexFor(n)
    return { n, pIdx, rest: isRest(selected), commits: commitsOn(selected), topic: scribble(n, pIdx), extras: extrasOn(selected) }
  })()

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
        {base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-soft" style={{ fontSize: '10px' }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const date = new Date(year, month, d)
          const n = dayNumber(date)
          const inPlan = n >= 1 && n <= totalDays
          const pIdx = inPlan ? phaseIndexFor(n) : -1
          const color = pIdx >= 0 ? PHASE_COLORS[pIdx % PHASE_COLORS.length] : null
          const rest = isRest(date)
          const commits = commitsOn(date)
          const extras = extrasOn(date)
          const isToday = sameDay(date, today)
          const isSel = selected && sameDay(date, selected)
          return (
            <button key={i} onClick={() => setSelected(date)}
              className="aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all hover:opacity-80"
              title={commits.length ? commits.map((c) => `${c.type}: ${c.name}`).join(', ') : (inPlan && !rest ? scribble(n, pIdx) : '')}
              style={{
                background: commits.length ? 'color-mix(in srgb, #E5484D 16%, transparent)' : (inPlan && !rest && color ? `${color}33` : 'var(--chip)'),
                boxShadow: isToday ? '0 0 0 2px var(--primary)' : (isSel ? '0 0 0 2px var(--text-soft)' : 'none'),
                opacity: rest ? 0.5 : 1,
              }}>
              <span className="text-xs" style={{ color: 'var(--text)', fontWeight: isToday ? 700 : 500 }}>{d}</span>
              {commits.length > 0 && <Flag size={9} className="absolute bottom-1" style={{ color: '#E5484D' }} />}
              {inPlan && !rest && commits.length === 0 && color && <span className="w-1 h-1 rounded-full absolute bottom-1.5" style={{ background: color }} />}
              {extras.length > 0 && <span className="w-1.5 h-1.5 rounded-full absolute top-1 right-1" style={{ background: 'var(--primary)' }} title="You added something" />}
            </button>
          )
        })}
      </div>

      {/* selected day detail */}
      {selInfo && (
        <div className="mt-4 px-4 py-3 rounded-2xl" style={{ background: 'var(--chip)', border: '1px solid var(--panel-border)' }}>
          <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--text)' }}>{selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          {selInfo.commits.map((c, j) => (
            <div key={j} className="text-xs flex items-center gap-1.5 mt-1" style={{ color: '#E5484D' }}>
              <Flag size={11} /> {c.type}: {c.name}
            </div>
          ))}
          {selInfo.n < 1 || selInfo.n > totalDays ? (
            <div className="text-xs text-soft">Outside your current plan.</div>
          ) : selInfo.rest ? (
            <div className="text-xs text-soft">A rest day. Enjoy it.</div>
          ) : (
            <div className="text-xs text-soft">Planned: {selInfo.topic}</div>
          )}
          {selInfo.extras.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {selInfo.extras.map((x, k) => (
                <div key={k} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--primary)' }} /> {x.title}{x.done ? ', done' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function WeekView({ weekStart, today, dayNumber, phaseIndexFor, isRest, commitsOn, extrasOn, scribble, totalDays }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-2">
      {days.map((date, i) => {
        const n = dayNumber(date)
        const inPlan = n >= 1 && n <= totalDays
        const pIdx = inPlan ? phaseIndexFor(n) : -1
        const color = pIdx >= 0 ? PHASE_COLORS[pIdx % PHASE_COLORS.length] : null
        const rest = isRest(date)
        const commits = commitsOn(date)
        const extras = extrasOn(date)
        const isToday = sameDay(date, today)
        return (
          <div key={i} className="flex items-stretch gap-3 rounded-2xl p-3" style={{ background: 'var(--chip)', border: isToday ? '1px solid var(--primary)' : '1px solid var(--panel-border)' }}>
            <div className="w-11 shrink-0 text-center flex flex-col justify-center">
              <div className="text-xs text-soft">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="text-lg font-semibold" style={{ color: isToday ? 'var(--primary)' : 'var(--text)', fontFamily: 'Fraunces, serif' }}>{date.getDate()}</div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 border-l pl-3" style={{ borderColor: 'var(--panel-border)' }}>
              {commits.map((c, j) => (
                <div key={j} className="text-xs flex items-center gap-1.5 font-medium" style={{ color: '#E5484D' }}>
                  <Flag size={11} /> {c.type}: {c.name}
                </div>
              ))}
              {!inPlan ? (
                <div className="text-xs text-soft">Outside your plan.</div>
              ) : rest ? (
                <div className="text-sm text-soft">Rest day</div>
              ) : (
                <div className="flex items-center gap-2">
                  {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />}
                  <span className="text-sm" style={{ color: 'var(--text)' }}>{scribble(n, pIdx)}</span>
                </div>
              )}
              {extras.map((x, k) => (
                <div key={'x' + k} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--primary)' }} /> {x.title}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}
