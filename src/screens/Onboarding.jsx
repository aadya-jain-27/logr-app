import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Plus, Check, Minus, X, Sparkles, BookOpen, Clock } from 'lucide-react'
import { SCENES } from '../scenes/scenes'
import { useScene } from '../theme'
import { saveProfile } from '../data/store'

const GOAL_SUGGESTIONS = ['Land an ML internship', 'Crack campus placements', 'Learn full-stack web dev', 'Ace this semester', 'Crack GATE', 'Ship a startup project']
const DEADLINES = ['In 1 month', 'In 3 months', 'In 6 months', 'By end of semester']
const COMMIT_TYPES = ['Exam', 'Assignment', 'Presentation']
const STEPS = 6

function Stepper({ label, sub, value, onChange }) {
  return (
    <div className="chip rounded-2xl px-4 py-3 flex items-center justify-between">
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</div>
        <div className="text-xs text-soft">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(0, +(value - 0.5).toFixed(1)))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--panel-border)', color: 'var(--text)' }}><Minus size={13} /></button>
        <span className="text-base font-semibold w-14 text-center" style={{ color: 'var(--text)' }}>{value}h</span>
        <button onClick={() => onChange(Math.min(10, +(value + 0.5).toFixed(1)))} className="w-7 h-7 rounded-full flex items-center justify-center btn-primary"><Plus size={13} /></button>
      </div>
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { scene, setScene } = useScene()
  const [step, setStep] = useState(0)
  const [p, setP] = useState({
    name: '', goal: '', deadline: '', weekday: 2, weekend: 4,
    commitments: [], skipWeekends: false, vacation: { from: '', to: '' }, resources: [], material: '',
  })
  const [nc, setNc] = useState({ name: '', date: '', type: 'Exam' })
  const [nr, setNr] = useState({ name: '', hours: '' })
  const set = (patch) => setP((prev) => ({ ...prev, ...patch }))

  const canNext = step === 1 ? p.goal.trim().length > 0 : true
  const next = () => (step < STEPS - 1 ? setStep((s) => s + 1) : finish())
  const back = () => setStep((s) => Math.max(0, s - 1))
  const finish = () => { saveProfile({ ...p, scene }); navigate('/today') }

  const addCommit = () => {
    if (!nc.name.trim() || !nc.date) return
    set({ commitments: [...p.commitments, nc] })
    setNc({ name: '', date: '', type: 'Exam' })
  }
  const addResource = () => {
    if (!nr.name.trim()) return
    set({ resources: [...p.resources, { name: nr.name.trim(), hours: nr.hours.trim() }] })
    setNr({ name: '', hours: '' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-24 pb-10">
      <div className="panel rounded-[32px] w-full max-w-[560px] p-8 md:p-10 max-h-[82vh] overflow-y-auto">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-7">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all" style={{ flex: i === step ? 2 : 1, background: i <= step ? 'var(--primary)' : 'var(--panel-border)' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}>

            {/* 0. Welcome + world */}
            {step === 0 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-medium mb-2" style={{ color: 'var(--text)' }}>Let's set up a calm path.</h1>
                <p className="text-soft text-[15px] mb-6">First, what should we call you, and which world would you like to plan in?</p>
                <input className="field w-full px-4 py-3 mb-6 text-sm outline-none" placeholder="Your name (optional)" value={p.name} onChange={(e) => set({ name: e.target.value })} />
                <div className="grid grid-cols-3 gap-2.5">
                  {SCENES.map((s) => {
                    const on = s.id === scene
                    return (
                      <button key={s.id} onClick={() => setScene(s.id)} className="chip rounded-2xl p-3 flex flex-col items-center gap-2 transition-transform hover:scale-[1.03]" style={{ boxShadow: on ? '0 0 0 2px var(--primary)' : 'none' }}>
                        <span className="w-7 h-7 rounded-full" style={{ background: s.swatch }} />
                        <span className="text-xs" style={{ color: 'var(--text)' }}>{s.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 1. Goal */}
            {step === 1 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-medium mb-2" style={{ color: 'var(--text)' }}>What are you working toward?</h1>
                <p className="text-soft text-[15px] mb-4">One clear goal, in your own words. Type anything below, or tap a suggestion to start.</p>
                <input className="field w-full px-4 py-3 mb-3 text-sm outline-none" placeholder="Type your goal, e.g. land a machine learning internship" value={p.goal} onChange={(e) => set({ goal: e.target.value })} autoFocus />
                <div className="flex flex-wrap gap-2 mb-6">
                  {GOAL_SUGGESTIONS.map((g) => (
                    <button key={g} onClick={() => set({ goal: g })} className="chip text-xs px-3 py-1.5 rounded-full hover:scale-[1.03] transition-transform" style={{ color: 'var(--text-soft)' }}>{g}</button>
                  ))}
                </div>
                <div className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>By when?</div>
                <div className="flex flex-wrap gap-2">
                  {DEADLINES.map((d) => {
                    const on = p.deadline === d
                    return <button key={d} onClick={() => set({ deadline: d })} className="text-xs px-3 py-1.5 rounded-full transition-transform hover:scale-[1.03]" style={{ background: on ? 'var(--primary)' : 'var(--chip)', color: on ? 'var(--on-primary)' : 'var(--text-soft)', border: '1px solid var(--panel-border)' }}>{d}</button>
                  })}
                </div>
              </div>
            )}

            {/* 2. Time */}
            {step === 2 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-medium mb-2" style={{ color: 'var(--text)' }}>How much time, honestly?</h1>
                <p className="text-soft text-[15px] mb-6">An average is fine. It's never the same every day, and Logr learns your real pace over time.</p>
                <div className="space-y-3">
                  <Stepper label="On a weekday" sub="hours you can usually give" value={p.weekday} onChange={(v) => set({ weekday: v })} />
                  <Stepper label="On a weekend" sub="when you have more room" value={p.weekend} onChange={(v) => set({ weekend: v })} />
                </div>
                <div className="chip rounded-2xl px-4 py-3 mt-3 flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text)' }}>Keep weekends free</span>
                  <button onClick={() => set({ skipWeekends: !p.skipWeekends })} className="w-11 h-6 rounded-full transition-colors relative" style={{ background: p.skipWeekends ? 'var(--primary)' : 'var(--panel-border)' }}>
                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: p.skipWeekends ? 22 : 2 }} />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Calendar */}
            {step === 3 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-medium mb-2" style={{ color: 'var(--text)' }}>Anything fixed coming up?</h1>
                <p className="text-soft text-[15px] mb-5">Exams, deadlines, a trip. We'll plan around them and ease off when you're busy. Skip if there's nothing yet.</p>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {COMMIT_TYPES.map((t) => {
                    const on = nc.type === t
                    return <button key={t} onClick={() => setNc({ ...nc, type: t })} className="text-xs px-3 py-1.5 rounded-full" style={{ background: on ? 'var(--primary)' : 'var(--chip)', color: on ? 'var(--on-primary)' : 'var(--text-soft)', border: '1px solid var(--panel-border)' }}>{t}</button>
                  })}
                </div>
                <div className="flex gap-2 mb-3">
                  <input className="field flex-1 px-3 py-2.5 text-sm outline-none" placeholder="e.g. Maths midterm" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} />
                  <input type="date" className="field px-3 py-2.5 text-sm outline-none" value={nc.date} onChange={(e) => setNc({ ...nc, date: e.target.value })} />
                  <button onClick={addCommit} className="btn-primary w-10 h-[42px] rounded-xl flex items-center justify-center shrink-0"><Plus size={16} /></button>
                </div>
                {p.commitments.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {p.commitments.map((c, i) => (
                      <div key={i} className="chip rounded-xl px-3 py-2 flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--text)' }}><span className="text-soft text-xs mr-2">{c.type}</span>{c.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-soft text-xs">{c.date}</span>
                          <button onClick={() => set({ commitments: p.commitments.filter((_, j) => j !== i) })}><X size={13} className="text-soft" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Resources */}
            {step === 4 && (
              <div>
                <h1 className="text-3xl md:text-4xl font-medium mb-2" style={{ color: 'var(--text)' }}>What are you learning from?</h1>
                <p className="text-soft text-[15px] mb-5">Add your courses, videos, or books. Length is optional. If you skip it we'll estimate, and we'll plan the next bit each day rather than cram it all in. Totally optional.</p>
                <div className="flex gap-2 mb-3">
                  <input className="field flex-1 px-3 py-2.5 text-sm outline-none" placeholder="e.g. Andrew Ng ML Course 1 (Coursera)" value={nr.name} onChange={(e) => setNr({ ...nr, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addResource()} />
                  <input className="field w-20 px-3 py-2.5 text-sm outline-none text-center" placeholder="~hrs" value={nr.hours} onChange={(e) => setNr({ ...nr, hours: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addResource()} />
                  <button onClick={addResource} className="btn-primary w-10 h-[42px] rounded-xl flex items-center justify-center shrink-0"><Plus size={16} /></button>
                </div>
                {p.resources.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {p.resources.map((r, i) => (
                      <div key={i} className="chip rounded-xl px-3 py-2.5 flex items-center justify-between text-sm gap-2">
                        <span className="flex items-center gap-2 min-w-0" style={{ color: 'var(--text)' }}>
                          <BookOpen size={14} className="shrink-0" style={{ color: 'var(--primary)' }} />
                          <span className="truncate">{r.name}</span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {r.hours
                            ? <span className="text-soft text-xs flex items-center gap-1"><Clock size={11} /> {r.hours}</span>
                            : <span className="text-soft text-xs" style={{ opacity: 0.65 }}>we'll estimate</span>}
                          <button onClick={() => set({ resources: p.resources.filter((_, j) => j !== i) })}><X size={13} className="text-soft" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <textarea className="field w-full px-4 py-3 text-sm outline-none resize-none" rows={3} placeholder={'Anything else to weave in? Extra topics or notes (optional)'} value={p.material} onChange={(e) => set({ material: e.target.value })} />
              </div>
            )}

            {/* 5. Ready */}
            {step === 5 && (
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}><Sparkles size={24} /></div>
                <h1 className="text-3xl md:text-4xl font-medium mb-3" style={{ color: 'var(--text)' }}>You're all set{p.name ? `, ${p.name}` : ''}.</h1>
                <p className="text-soft text-[15px] mb-6 max-w-sm mx-auto">
                  Your calm path is ready. From here, you'll only ever see the few things that matter today, nothing more.
                </p>
                <div className="chip rounded-2xl px-4 py-3 text-left text-sm inline-block">
                  <div style={{ color: 'var(--text)' }} className="font-medium mb-1">{p.goal || 'Your goal'}</div>
                  <div className="text-soft text-xs">{p.weekday}h weekdays, {p.weekend}h weekends{p.deadline ? `, ${p.deadline}` : ''}{p.resources.length ? `, ${p.resources.length} resource${p.resources.length > 1 ? 's' : ''}` : ''}</div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button onClick={back} className="flex items-center gap-1.5 text-sm text-soft hover:opacity-75 transition-opacity"><ArrowLeft size={15} /> Back</button>
          ) : <span />}
          <div className="flex items-center gap-3">
            {(step === 3 || step === 4) && <button onClick={next} className="text-sm text-soft hover:opacity-75 transition-opacity">Skip</button>}
            <button onClick={next} disabled={!canNext} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold" style={{ opacity: canNext ? 1 : 0.5, cursor: canNext ? 'pointer' : 'not-allowed' }}>
              {step === STEPS - 1 ? 'Show me today' : 'Continue'} {step === STEPS - 1 ? <Check size={15} /> : <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
