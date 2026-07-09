import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Trash2, BookOpen, Link as LinkIcon, Plus, Bell, BellOff } from 'lucide-react'
import { getProfile, saveProfile } from '../data/store'
import { useScene } from '../theme'
import { SCENES } from '../scenes/scenes'
import { requestPermission, scheduleDaily } from '../lib/notify'

const isYouTube = (u) => /youtu\.?be/.test(u || '')

export default function Settings() {
  const navigate = useNavigate()
  const { setScene } = useScene()
  const raw = getProfile()

  const [form, setForm] = useState({
    name: raw?.name || '',
    goal: raw?.goal || '',
    deadline: raw?.deadline || '',
    wkday: raw?.wkday || '',
    wkend: raw?.wkend || '',
    skipWeekend: raw?.skipWeekends ?? raw?.skipWeekend ?? false,
    scene: raw?.scene || 'sunset',
    notifyAt: raw?.notifyAt || '',
    resources: (raw?.resources || []).map((r) => ({ ...r, done: r.done ?? false })),
  })

  const [nr, setNr] = useState({ name: '', hours: '', url: '', notes: '' })
  const [saved, setSaved] = useState(false)
  const [notifyPerm, setNotifyPerm] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'))

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const addResource = () => {
    if (!nr.name.trim()) return
    set('resources', [...form.resources, { ...nr, done: false }])
    setNr({ name: '', hours: '', url: '', notes: '' })
  }

  const toggleDone = (i) => set('resources', form.resources.map((r, idx) => idx === i ? { ...r, done: !r.done } : r))
  const removeResource = (i) => set('resources', form.resources.filter((_, idx) => idx !== i))

  const enableNotifications = async () => {
    const perm = await requestPermission()
    setNotifyPerm(perm)
    if (perm === 'granted' && form.notifyAt) scheduleDaily(form.notifyAt)
  }

  const save = () => {
    saveProfile({ ...raw, ...form, scene: form.scene, weekday: form.wkday, weekend: form.wkend, skipWeekends: form.skipWeekend })
    setScene(form.scene)
    if (form.notifyAt && notifyPerm === 'granted') scheduleDaily(form.notifyAt)
    setSaved(true)
    setTimeout(() => navigate('/today'), 900)
  }

  const label = 'block text-xs font-semibold mb-1.5'
  const field = 'field w-full px-3.5 py-2.5 rounded-xl text-sm outline-none'

  return (
    <div className="min-h-screen px-5 md:px-10 pt-28 pb-16 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        className="panel rounded-[32px] w-full max-w-[520px] p-8 md:p-10"
      >
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-soft text-sm mb-6 hover:opacity-75 transition-opacity">
          <ArrowLeft size={15} /> Back
        </button>

        <h1 className="text-2xl font-semibold mb-7" style={{ color: 'var(--text)', fontFamily: 'Fraunces, serif' }}>Settings</h1>

        <div className="space-y-6">
          {/* Identity */}
          <div>
            <label className={label} style={{ color: 'var(--text)' }}>Your name</label>
            <input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="What should we call you?" />
          </div>

          <div>
            <label className={label} style={{ color: 'var(--text)' }}>Your goal</label>
            <input className={field} value={form.goal} onChange={(e) => set('goal', e.target.value)} placeholder="e.g. Finish the ML course by May" />
          </div>

          <div>
            <label className={label} style={{ color: 'var(--text)' }}>Target date</label>
            <input type="date" className={field} value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} style={{ color: 'var(--text)' }}>Weekday hours</label>
              <input type="number" min="0.5" max="12" step="0.5" className={field}
                value={form.wkday} onChange={(e) => set('wkday', e.target.value)} placeholder="e.g. 2" />
            </div>
            <div>
              <label className={label} style={{ color: 'var(--text)' }}>Weekend hours</label>
              <input type="number" min="0.5" max="12" step="0.5" className={field}
                value={form.wkend} onChange={(e) => set('wkend', e.target.value)} placeholder="e.g. 4" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => set('skipWeekend', !form.skipWeekend)}
              className="w-10 h-6 rounded-full transition-colors relative shrink-0"
              style={{ background: form.skipWeekend ? 'var(--primary)' : 'var(--panel-border)' }}
            >
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ left: form.skipWeekend ? '18px' : '2px' }} />
            </button>
            <span className="text-sm" style={{ color: 'var(--text)' }}>Weekends are for rest, not study</span>
          </div>

          {/* World */}
          <div>
            <label className={label} style={{ color: 'var(--text)' }}>Your world</label>
            <div className="flex flex-wrap gap-2">
              {SCENES.map((s) => (
                <button key={s.id} onClick={() => set('scene', s.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all"
                  style={{
                    background: form.scene === s.id ? s.swatch : 'var(--chip)',
                    color: form.scene === s.id ? '#fff' : 'var(--text-soft)',
                    border: '1px solid var(--panel-border)',
                  }}>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.swatch }} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <label className={label} style={{ color: 'var(--text)' }}>Resources</label>

            {form.resources.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.resources.map((r, i) => (
                  <div key={i} className="chip rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
                    style={{ opacity: r.done ? 0.5 : 1 }}>
                    <button onClick={() => toggleDone(i)}
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                      style={{ background: r.done ? 'var(--primary)' : 'transparent', border: r.done ? 'none' : '2px solid var(--text-soft)', color: 'var(--on-primary)' }}
                      title={r.done ? 'Mark not done' : 'Mark complete'}>
                      {r.done && <Check size={11} strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isYouTube(r.url) ? (
                          <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0 fill-current" style={{ color: '#FF0000' }}><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" /></svg>
                        ) : (
                          <BookOpen size={11} style={{ color: 'var(--primary)' }} className="shrink-0" />
                        )}
                        <span className="text-sm font-medium" style={{ color: 'var(--text)', textDecoration: r.done ? 'line-through' : 'none' }}>{r.name}</span>
                        {r.hours && <span className="text-xs text-soft">{r.hours}</span>}
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            className="shrink-0" style={{ color: 'var(--primary)' }}>
                            <LinkIcon size={11} />
                          </a>
                        )}
                      </div>
                      {r.notes && <div className="text-xs text-soft mt-0.5 truncate">{r.notes}</div>}
                    </div>
                    <button onClick={() => removeResource(i)} className="shrink-0 hover:opacity-75 transition-opacity" style={{ color: 'var(--text-soft)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', overflow: 'hidden' }}>
              <div className="flex" style={{ borderBottom: nr.url || nr.notes ? '1px solid var(--panel-border)' : 'none' }}>
                <input className="flex-1 px-3.5 py-2.5 text-sm outline-none bg-transparent" placeholder="Add a resource name"
                  style={{ color: 'var(--text)' }} value={nr.name} onChange={(e) => setNr({ ...nr, name: e.target.value })} />
                <input className="w-20 px-2 py-2.5 text-sm outline-none bg-transparent text-center" placeholder="hrs"
                  style={{ color: 'var(--text)', borderLeft: '1px solid var(--panel-border)' }}
                  value={nr.hours} onChange={(e) => setNr({ ...nr, hours: e.target.value })} />
                <button onClick={addResource}
                  className="w-10 h-full flex items-center justify-center transition-opacity hover:opacity-75"
                  style={{ color: 'var(--primary)', borderLeft: '1px solid var(--panel-border)' }}>
                  <Plus size={18} />
                </button>
              </div>
              <input className="w-full px-3.5 py-2.5 text-sm outline-none bg-transparent" placeholder="Link (YouTube or course)"
                style={{ color: 'var(--text)', borderBottom: nr.notes ? '1px solid var(--panel-border)' : 'none' }}
                value={nr.url} onChange={(e) => setNr({ ...nr, url: e.target.value })} />
              {nr.url && (
                <textarea className="w-full px-3.5 py-2.5 text-sm outline-none bg-transparent resize-none" rows={2}
                  placeholder="Constraints, e.g. finish today..."
                  style={{ color: 'var(--text)' }}
                  value={nr.notes} onChange={(e) => setNr({ ...nr, notes: e.target.value })} />
              )}
            </div>
            <p className="text-xs text-soft mt-2">Check a resource to mark it complete. Completed resources won't be planned.</p>
          </div>

          {/* Daily reminder */}
          <div>
            <label className={label} style={{ color: 'var(--text)' }}>Daily reminder</label>
            {notifyPerm === 'unsupported' && (
              <p className="text-xs text-soft">Your browser doesn't support notifications.</p>
            )}
            {notifyPerm === 'denied' && (
              <p className="text-xs text-soft">Notifications are blocked. Allow them in your browser settings, then come back.</p>
            )}
            {notifyPerm !== 'unsupported' && notifyPerm !== 'denied' && (
              <div className="flex items-center gap-3">
                <input type="time" className={`${field} flex-1`}
                  value={form.notifyAt} onChange={(e) => set('notifyAt', e.target.value)} />
                {notifyPerm !== 'granted' ? (
                  <button onClick={enableNotifications}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
                    <Bell size={14} /> Allow
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: 'var(--primary)' }}>
                    <Bell size={13} /> On
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-soft mt-2">We'll remind you at this time each day. Requires the tab to stay open.</p>
          </div>
        </div>

        <button
          onClick={save}
          className="btn-primary w-full mt-8 py-3.5 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all"
        >
          {saved ? <><Check size={16} strokeWidth={3} /> Saved</> : 'Save changes'}
        </button>
      </motion.div>
    </div>
  )
}
