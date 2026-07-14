import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Clock, CalendarHeart, Check } from 'lucide-react'
import { monthStats, getHistory, monthCompletions } from '../data/store'

function intensity(minutes) {
  if (!minutes) return 0.1
  if (minutes >= 90) return 1
  if (minutes >= 60) return 0.78
  if (minutes >= 30) return 0.55
  return 0.35
}

function weekStats() {
  const history = getHistory()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toDateString()
    const v = history[key] || null
    days.push({ date: d, key, v, isToday: i === 0 })
  }
  return days
}

export default function Journey() {
  const [view, setView] = useState('month')
  const { tasksDone, minutes, activeDays, days, year, month } = monthStats()
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long' })
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayNum = new Date().getDate()
  const hours = Math.round((minutes / 60) * 10) / 10
  const weekDays = weekStats()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const completed = monthCompletions()

  const stats = [
    { icon: CheckCircle2, value: tasksDone, label: 'things done' },
    { icon: Clock, value: `${hours}h`, label: 'time invested' },
    { icon: CalendarHeart, value: activeDays, label: activeDays === 1 ? 'day shown up' : 'days shown up' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-24 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="panel rounded-[32px] w-full max-w-[540px] p-8 md:p-10"
      >
        <Link to="/today" className="flex items-center gap-1.5 text-sm text-soft hover:opacity-75 transition-opacity mb-5">
          <ArrowLeft size={15} /> Back to today
        </Link>

        <p className="text-soft text-sm mb-1">{monthName} {year}</p>
        <h1 className="text-3xl md:text-[2.3rem] font-medium leading-tight mb-2" style={{ color: 'var(--text)' }}>
          {activeDays === 0 ? 'Your journey starts today.' : 'Look how far you have come.'}
        </h1>
        <p className="text-soft text-[15px] mb-7">
          {activeDays === 0
            ? 'Finish even one thing today, and it will show up here. Something done always beats never starting.'
            : `Every filled day is something you actually did. That is real progress, ${monthName} is adding up.`}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {stats.map((s) => (
            <div key={s.label} className="chip rounded-2xl p-4 text-center">
              <s.icon size={16} style={{ color: 'var(--primary)' }} className="mx-auto mb-1.5" />
              <div className="text-2xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Fraunces, serif' }}>{s.value}</div>
              <div className="text-soft text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-2xl mb-5 w-fit" style={{ background: 'var(--chip)', border: '1px solid var(--panel-border)' }}>
          {['week', 'month'].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-xl text-xs font-medium capitalize transition-all"
              style={{
                background: view === v ? 'var(--primary)' : 'transparent',
                color: view === v ? 'var(--on-primary)' : 'var(--text-soft)',
              }}>
              {v}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {view === 'month' ? (
            <motion.div key="month" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              <div className="grid grid-cols-7 gap-1.5 mb-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-soft" style={{ fontSize: '10px' }}>{d}</div>
                ))}
                {cells.map((d, i) => {
                  if (d === null) return <div key={i} />
                  const v = days[d]
                  const isToday = d === todayNum
                  return (
                    <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-xs transition-all"
                      style={{
                        background: v ? `color-mix(in srgb, var(--primary) ${intensity(v.minutes) * 100}%, transparent)` : 'var(--chip)',
                        color: v && intensity(v.minutes) > 0.5 ? 'var(--on-primary)' : 'var(--text-soft)',
                        boxShadow: isToday ? '0 0 0 2px var(--primary)' : 'none',
                        fontWeight: v ? 600 : 400,
                      }}
                      title={v ? `${v.done} done, ${v.minutes} min` : ''}
                    >
                      {d}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="week" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              <div className="space-y-2.5 mb-3">
                {weekDays.map(({ date, v, isToday }) => {
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                  const dateNum = date.getDate()
                  const pct = v ? Math.min(100, Math.round((v.minutes / 120) * 100)) : 0
                  return (
                    <div key={date.toDateString()} className="flex items-center gap-3">
                      <div className="w-14 shrink-0 text-right">
                        <div className="text-xs font-medium" style={{ color: isToday ? 'var(--primary)' : 'var(--text)' }}>{dayName}</div>
                        <div className="text-xs text-soft">{dateNum}</div>
                      </div>
                      <div className="flex-1 h-8 rounded-xl overflow-hidden relative" style={{ background: 'var(--chip)' }}>
                        <div className="absolute inset-y-0 left-0 rounded-xl transition-all"
                          style={{ width: `${pct}%`, background: `color-mix(in srgb, var(--primary) 70%, transparent)`, minWidth: pct > 0 ? '8px' : '0' }} />
                        {v && (
                          <div className="absolute inset-0 flex items-center px-3 gap-2">
                            <span className="text-xs font-medium z-10" style={{ color: pct > 40 ? 'var(--on-primary)' : 'var(--text)' }}>
                              {v.done} {v.done === 1 ? 'task' : 'tasks'}
                            </span>
                            <span className="text-xs z-10" style={{ color: pct > 40 ? 'var(--on-primary)' : 'var(--text-soft)', opacity: 0.8 }}>
                              {Math.round(v.minutes / 6) / 10}h
                            </span>
                          </div>
                        )}
                        {!v && (
                          <div className="absolute inset-0 flex items-center px-3">
                            <span className="text-xs text-soft">{isToday ? 'today' : 'rest'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {completed.length > 0 && (
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--panel-border)' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Finished this month</p>
            </div>
            <div className="space-y-2">
              {completed.map((c, i) => (
                <div key={i} className="chip rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text)' }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-soft text-xs text-center mt-4" style={{ opacity: 0.85 }}>
          We only ever show what you did, never what you missed.
        </p>
      </motion.div>
    </div>
  )
}
