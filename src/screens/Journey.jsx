import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Clock, CalendarHeart } from 'lucide-react'
import { monthStats } from '../data/store'

// Opacity by how much was done that day. Empty days stay faint, never red.
function intensity(minutes) {
  if (!minutes) return 0.1
  if (minutes >= 90) return 1
  if (minutes >= 60) return 0.78
  if (minutes >= 30) return 0.55
  return 0.35
}

export default function Journey() {
  const { tasksDone, minutes, activeDays, days, year, month } = monthStats()
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long' })
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayNum = new Date().getDate()
  const hours = Math.round((minutes / 60) * 10) / 10

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

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
              <div className="text-2xl font-display font-bold" style={{ color: 'var(--text)', fontFamily: 'Fraunces, serif' }}>{s.value}</div>
              <div className="text-soft text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Calendar */}
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

        <p className="text-soft text-xs text-center mt-5" style={{ opacity: 0.85 }}>
          We only ever show what you did, never what you missed.
        </p>
      </motion.div>
    </div>
  )
}
