import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Compass, GitBranch, Hammer, Check, Sparkles, CloudOff, RefreshCw, CalendarDays } from 'lucide-react'
import { getProfile, getValidRoadmap, saveRoadmap, clearRoadmap, pathDay } from '../data/store'
import { requestRoadmap } from '../lib/plan'

export default function Path() {
  const profile = getProfile()

  const [status, setStatus] = useState('loading') // loading | ready | error
  const [roadmap, setRoadmap] = useState(null)
  const [dayInfo, setDayInfo] = useState(null)
  const [errKind, setErrKind] = useState(null)

  const generate = async () => {
    if (!profile) return
    setStatus('loading')
    const r = await requestRoadmap({
      goal: profile.goal, deadline: profile.deadline,
      weekdayHours: profile.weekday, weekendHours: profile.weekend, resources: profile.resources,
    })
    if (r && Array.isArray(r.phases) && r.phases.length && !r.error) {
      saveRoadmap(profile, r)
      setRoadmap(r)
      setDayInfo(pathDay(profile))
      setStatus('ready')
    } else {
      setErrKind(r?.error === 'no_key' ? 'no_key' : 'failed')
      setStatus('error')
    }
  }

  useEffect(() => {
    if (!profile) return
    const cached = getValidRoadmap(profile)
    if (cached) {
      setRoadmap(cached.roadmap)
      setDayInfo(pathDay(profile))
      setStatus('ready')
    } else {
      generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!profile) return <Navigate to="/welcome" replace />

  const reshape = () => { clearRoadmap(); generate() }

  const goal = profile.goal?.trim() || 'your goal'
  const phases = roadmap?.phases || []
  const projects = roadmap?.projects || []
  const day = dayInfo?.day ?? 1
  const currentIdx = phases.findIndex((p) => day >= p.dayStart && day <= p.dayEnd)

  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="panel rounded-[32px] w-full max-w-[560px] p-8 md:p-10 max-h-[84vh] overflow-y-auto"
      >
        <Link to="/today" className="flex items-center gap-1.5 text-sm text-soft hover:opacity-75 transition-opacity mb-5">
          <ArrowLeft size={15} /> Back to today
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <Compass size={15} style={{ color: 'var(--primary)' }} />
          <p className="text-soft text-sm">The path{dayInfo ? `, day ${day}${dayInfo.total ? ` of ${dayInfo.total}` : ''}` : ''}</p>
        </div>
        <h1 className="text-3xl md:text-[2.3rem] font-medium leading-tight mb-3" style={{ color: 'var(--text)' }}>{goal}</h1>

        {status === 'loading' && (
          <div className="py-6">
            <motion.p className="text-soft text-[15px] flex items-center gap-2" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
              <Sparkles size={15} style={{ color: 'var(--primary)' }} /> Shaping the whole path, so you never have to hold it...
            </motion.p>
            <div className="space-y-2.5 mt-5">
              {[0, 1, 2, 3].map((i) => (
                <motion.div key={i} className="chip rounded-2xl h-14" animate={{ opacity: [0.4, 0.75, 0.4] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8 text-center">
            <CloudOff size={26} style={{ color: 'var(--text-soft)' }} className="mx-auto mb-3" />
            <p className="text-[15px]" style={{ color: 'var(--text)' }}>
              {errKind === 'no_key' ? 'Planning is not connected yet.' : "I couldn't shape the path just now."}
            </p>
            <p className="text-soft text-sm mt-1 mb-5">
              {errKind === 'no_key' ? 'Add a Gemini key to .env to turn on planning.' : 'It might be a brief hiccup. Try again in a moment.'}
            </p>
            <button onClick={generate} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"><RefreshCw size={14} /> Try again</button>
          </div>
        )}

        {status === 'ready' && roadmap && (
          <>
            {roadmap.summary && (
              <p className="text-soft text-[15px] leading-relaxed mb-3">{roadmap.summary}</p>
            )}
            <Link to="/plan" className="inline-flex items-center gap-1.5 text-sm mb-7 hover:opacity-75 transition-opacity" style={{ color: 'var(--primary)' }}>
              <CalendarDays size={14} /> See it on a calendar
            </Link>

            {/* Phases as a calm vertical timeline. The current stretch is gently lit. */}
            <div className="relative">
              {phases.map((p, i) => {
                const isNow = i === currentIdx
                const isPast = currentIdx >= 0 && i < currentIdx
                const last = i === phases.length - 1
                return (
                  <div key={i} className="flex gap-3.5">
                    {/* rail */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: isNow || isPast ? 'var(--primary)' : 'transparent',
                          border: isNow || isPast ? 'none' : '2px solid var(--panel-border)',
                          color: 'var(--on-primary)',
                          boxShadow: isNow ? '0 0 0 4px color-mix(in srgb, var(--primary) 22%, transparent)' : 'none',
                        }}>
                        {isPast ? <Check size={13} strokeWidth={3} /> : isNow ? <span className="w-2 h-2 rounded-full bg-white" /> : null}
                      </div>
                      {!last && <div className="w-px flex-1 my-1" style={{ background: 'var(--panel-border)' }} />}
                    </div>
                    {/* content */}
                    <div className={`pb-5 flex-1 min-w-0 ${isPast ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>{p.title}</span>
                        {isNow && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>you are here</span>
                        )}
                      </div>
                      <div className="text-soft text-xs mt-0.5">Days {p.dayStart} to {p.dayEnd}</div>
                      {p.focus && <p className="text-soft text-sm mt-1.5 leading-snug">{p.focus}</p>}
                      {Array.isArray(p.resources) && p.resources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.resources.map((r, j) => (
                            <span key={j} className="chip text-xs px-2.5 py-1 rounded-full" style={{ color: 'var(--text-soft)' }}>{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Projects to prove the skill */}
            {projects.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-3">
                  <Hammer size={15} style={{ color: 'var(--primary)' }} />
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Build these to prove it</h2>
                </div>
                <div className="space-y-2.5">
                  {projects.map((pr, i) => (
                    <div key={i} className="chip rounded-2xl p-4">
                      <div className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>{pr.title}</div>
                      {pr.what && <p className="text-soft text-sm leading-snug">{pr.what}</p>}
                      {pr.proves && (
                        <div className="text-xs mt-2" style={{ color: 'var(--primary)' }}>shows: {pr.proves}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roadmap.githubNote && (
              <div className="flex items-start gap-2.5 mt-5 px-4 py-3 rounded-2xl" style={{ background: 'var(--chip)', border: '1px solid var(--panel-border)' }}>
                <GitBranch size={16} style={{ color: 'var(--text)' }} className="mt-0.5 shrink-0" />
                <p className="text-sm" style={{ color: 'var(--text)' }}>{roadmap.githubNote}</p>
              </div>
            )}

            <p className="text-soft text-xs text-center mt-7" style={{ opacity: 0.85 }}>
              You do not have to hold all of this. Come back whenever you want the bigger picture. Otherwise, just today is enough.
            </p>
            <div className="text-center mt-3">
              <button onClick={reshape} className="text-xs text-soft hover:opacity-75 transition-opacity inline-flex items-center gap-1.5">
                <RefreshCw size={12} /> Reshape the path
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
