import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Trash2, BookOpen, Link as LinkIcon, Plus, Bell, Paperclip, Loader, Pencil, X } from 'lucide-react'
import { getProfile, saveProfile } from '../data/store'
import { useScene } from '../theme'
import { SCENES } from '../scenes/scenes'
import { requestPermission, scheduleDaily } from '../lib/notify'
import { isYouTube } from '../lib/util'
import { extractFileText } from '../lib/filetext'

export default function Settings() {
  const navigate = useNavigate()
  const { setScene } = useScene()
  const raw = getProfile()

  const [form, setForm] = useState({
    name: raw?.name || '',
    goal: raw?.goal || '',
    deadline: raw?.deadline || '',
    wkday: raw?.weekday ?? raw?.wkday ?? '',
    wkend: raw?.weekend ?? raw?.wkend ?? '',
    skipWeekend: raw?.skipWeekends ?? raw?.skipWeekend ?? false,
    scene: raw?.scene || 'sunset',
    notifyAt: raw?.notifyAt || '',
    resources: (raw?.resources || []).map((r) => ({ ...r, done: r.done ?? false })),
    commitments: raw?.commitments || [],
  })

  const [nr, setNr] = useState({ name: '', hours: '', url: '', notes: '', file: null })
  const [editIdx, setEditIdx] = useState(null)
  const [edit, setEdit] = useState({ name: '', hours: '', url: '', notes: '' })
  const [fileLoading, setFileLoading] = useState(false)
  const [fileErr, setFileErr] = useState('')
  const [nc, setNc] = useState({ name: '', date: '', type: 'Exam' })
  const [saved, setSaved] = useState(false)
  const [notifyPerm, setNotifyPerm] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'))
  const [confirmReset, setConfirmReset] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const addResource = () => {
    if (!nr.name.trim()) return
    set('resources', [...form.resources, { ...nr, done: false }])
    setNr({ name: '', hours: '', url: '', notes: '', file: null })
    setFileErr('')
  }
  const handleFileUpload = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileErr('')
    if (f.size > 40 * 1024 * 1024) { setFileErr('That file is very large. Try one under 40 MB, or paste a link instead.'); e.target.value = ''; return }
    setFileLoading(true)
    try {
      const extracted = await extractFileText(f)
      if (!extracted || !extracted.text.trim()) { setFileErr('Could not read text from that file. Try a PDF or PPTX, or paste a link.'); e.target.value = ''; return }
      const res = await fetch('/api/parse-file', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(extracted) })
      const data = await res.json()
      if (!data.error) {
        setNr((prev) => ({ ...prev, name: prev.name || data.title || f.name, hours: prev.hours || (data.pageCount ? String(Math.round(data.pageCount / 15)) : ''), notes: prev.notes || (data.summary || ''), file: { name: f.name, pageCount: data.pageCount, topics: data.topics, summary: data.summary } }))
      } else { setFileErr('Could not read that file. You can type the details instead.') }
    } catch { setFileErr('Could not read that file. You can type the details instead.') } finally { setFileLoading(false) }
    e.target.value = ''
  }

  const toggleDone = (i) => set('resources', form.resources.map((r, idx) => idx === i ? { ...r, done: !r.done } : r))
  const removeResource = (i) => { if (editIdx === i) cancelEdit(); set('resources', form.resources.filter((_, idx) => idx !== i)) }

  // Editing an existing resource. Changing its name, hours, link, or constraints updates
  // the saved profile, which changes the plan signature and forces a fresh plan on Today.
  const startEdit = (i) => {
    const r = form.resources[i]
    setEditIdx(i)
    setEdit({ name: r.name || '', hours: r.hours || '', url: r.url || '', notes: r.notes || '' })
  }
  const cancelEdit = () => { setEditIdx(null); setEdit({ name: '', hours: '', url: '', notes: '' }) }
  const saveEdit = () => {
    if (!edit.name.trim()) return
    set('resources', form.resources.map((r, idx) => (idx === editIdx
      ? { ...r, name: edit.name.trim(), hours: edit.hours.trim(), url: edit.url.trim(), notes: edit.notes.trim() }
      : r)))
    cancelEdit()
  }

  const addCommit = () => {
    if (!nc.name.trim() || !nc.date) return
    set('commitments', [...form.commitments, nc])
    setNc({ name: '', date: '', type: 'Exam' })
  }
  const removeCommit = (i) => set('commitments', form.commitments.filter((_, idx) => idx !== i))

  const enableNotifications = async () => {
    const perm = await requestPermission()
    setNotifyPerm(perm)
    if (perm === 'granted' && form.notifyAt) scheduleDaily(form.notifyAt)
  }

  const save = () => {
    saveProfile({ ...raw, ...form, scene: form.scene, weekday: Number(form.wkday) || 2, weekend: Number(form.wkend) || 3, skipWeekends: form.skipWeekend })
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
            <label className={label} style={{ color: 'var(--text)' }}>Target timeframe</label>
            <input className={field} value={form.deadline} onChange={(e) => set('deadline', e.target.value)} placeholder="e.g. In 6 months, or by end of semester" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['In 1 month', 'In 3 months', 'In 6 months', 'By end of semester'].map((d) => (
                <button key={d} onClick={() => set('deadline', d)} className="text-xs px-3 py-1.5 rounded-full transition-colors" style={{ background: form.deadline === d ? 'var(--primary)' : 'var(--chip)', color: form.deadline === d ? 'var(--on-primary)' : 'var(--text-soft)', border: '1px solid var(--panel-border)' }}>{d}</button>
              ))}
            </div>
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
            <label className={label} style={{ color: 'var(--text)' }}>What you're learning from</label>

            {form.resources.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.resources.map((r, i) => (
                  editIdx === i ? (
                    <div key={i} style={{ border: '1px solid var(--panel-border)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div className="flex" style={{ borderBottom: '1px solid var(--panel-border)' }}>
                        <input autoFocus className="flex-1 px-3.5 py-2.5 text-sm outline-none bg-transparent" placeholder="Resource name"
                          style={{ color: 'var(--text)' }} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }} />
                        <input className="w-20 px-2 py-2.5 text-sm outline-none bg-transparent text-center" placeholder="hrs"
                          style={{ color: 'var(--text)', borderLeft: '1px solid var(--panel-border)' }}
                          value={edit.hours} onChange={(e) => setEdit({ ...edit, hours: e.target.value })} />
                      </div>
                      <input className="w-full px-3.5 py-2.5 text-sm outline-none bg-transparent" placeholder="Link (YouTube or course)"
                        style={{ color: 'var(--text)', borderBottom: '1px solid var(--panel-border)' }}
                        value={edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} />
                      <textarea className="w-full px-3.5 py-2.5 text-sm outline-none bg-transparent resize-none" rows={2}
                        placeholder="Constraints, e.g. finish today, divide across 3 days (optional)"
                        style={{ color: 'var(--text)' }} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
                      <div className="flex items-center justify-end gap-2 px-3 py-2" style={{ borderTop: '1px solid var(--panel-border)' }}>
                        <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1 hover:opacity-75 transition-opacity" style={{ color: 'var(--text-soft)' }}>
                          <X size={12} /> Cancel
                        </button>
                        <button onClick={saveEdit} disabled={!edit.name.trim()} className="btn-primary text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1 font-semibold" style={{ opacity: edit.name.trim() ? 1 : 0.5 }}>
                          <Check size={12} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
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
                    <button onClick={() => startEdit(i)} className="shrink-0 hover:opacity-75 transition-opacity" style={{ color: 'var(--text-soft)' }} title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => removeResource(i)} className="shrink-0 hover:opacity-75 transition-opacity" style={{ color: 'var(--text-soft)' }} title="Remove">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  )
                ))}
              </div>
            )}

            <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', overflow: 'hidden' }}>
              <div className="flex" style={{ borderBottom: '1px solid var(--panel-border)' }}>
                <input className="flex-1 px-3.5 py-2.5 text-sm outline-none bg-transparent" placeholder="Add a resource name"
                  style={{ color: 'var(--text)' }} value={nr.name} onChange={(e) => { setNr({ ...nr, name: e.target.value }); setFileErr('') }} />
                <input className="w-20 px-2 py-2.5 text-sm outline-none bg-transparent text-center" placeholder="hrs"
                  style={{ color: 'var(--text)', borderLeft: '1px solid var(--panel-border)' }}
                  value={nr.hours} onChange={(e) => setNr({ ...nr, hours: e.target.value })} />
                <label className="w-10 shrink-0 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-75" style={{ borderLeft: '1px solid var(--panel-border)', color: 'var(--text-soft)' }} title="Upload a PDF or PPT">
                  {fileLoading ? <Loader size={15} className="animate-spin" /> : <Paperclip size={15} />}
                  <input type="file" accept=".pdf,.ppt,.pptx" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={addResource}
                  className="w-10 h-full flex items-center justify-center transition-opacity hover:opacity-75"
                  style={{ color: 'var(--primary)', borderLeft: '1px solid var(--panel-border)' }}>
                  <Plus size={18} />
                </button>
              </div>
              {nr.file && (
                <div className="px-3.5 py-1.5 text-xs flex items-center gap-1.5" style={{ borderTop: '1px solid var(--panel-border)', color: 'var(--primary)' }}>
                  <Paperclip size={11} /> {nr.file.name}{nr.file.pageCount ? ` (${nr.file.pageCount} pages)` : nr.file.topics?.length ? ` (${nr.file.topics.length} topics)` : ''}
                </div>
              )}
              {fileErr && (
                <div className="px-3.5 py-1.5 text-xs" style={{ borderTop: '1px solid var(--panel-border)', color: 'var(--text-soft)' }}>{fileErr}</div>
              )}
              <input className="w-full px-3.5 py-2.5 text-sm outline-none bg-transparent" placeholder="Link (YouTube or course, optional)"
                style={{ color: 'var(--text)', borderBottom: '1px solid var(--panel-border)' }}
                value={nr.url} onChange={(e) => { setNr({ ...nr, url: e.target.value }); setFileErr('') }} />
              <textarea className="w-full px-3.5 py-2.5 text-sm outline-none bg-transparent resize-none" rows={2}
                placeholder="Constraints, e.g. finish today, divide across 3 days (optional)"
                style={{ color: 'var(--text)' }}
                value={nr.notes} onChange={(e) => setNr({ ...nr, notes: e.target.value })} />
            </div>
            <p className="text-xs text-soft mt-2">Check a resource to mark it complete. Completed resources won't be planned.</p>
          </div>

          {/* Commitments */}
          <div>
            <label className={label} style={{ color: 'var(--text)' }}>Exams and deadlines</label>
            {form.commitments.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.commitments.map((c, i) => (
                  <div key={i} className="chip rounded-xl px-3.5 py-2.5 flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text)' }}><span className="text-soft text-xs mr-2">{c.type}</span>{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-soft text-xs">{c.date}</span>
                      <button onClick={() => removeCommit(i)}><Trash2 size={13} className="text-soft" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['Exam', 'Assignment', 'Presentation'].map((t) => {
                const on = nc.type === t
                return <button key={t} onClick={() => setNc({ ...nc, type: t })} className="text-xs px-3 py-1.5 rounded-full" style={{ background: on ? 'var(--primary)' : 'var(--chip)', color: on ? 'var(--on-primary)' : 'var(--text-soft)', border: '1px solid var(--panel-border)' }}>{t}</button>
              })}
            </div>
            <div className="flex gap-2">
              <input className={`${field} flex-1`} placeholder="e.g. Maths midterm" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} />
              <input type="date" className={field} style={{ width: 'auto' }} value={nc.date} onChange={(e) => setNc({ ...nc, date: e.target.value })} />
              <button onClick={addCommit} className="btn-primary w-10 rounded-xl flex items-center justify-center shrink-0"><Plus size={16} /></button>
            </div>
            <p className="text-xs text-soft mt-2">We mark these on your calendar and keep those days lighter.</p>
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

        <div className="text-center mt-4">
          {confirmReset ? (
            <span className="text-sm inline-flex items-center gap-2 flex-wrap justify-center" style={{ color: 'var(--text-soft)' }}>
              Clear your goal, plan, and progress?
              <button onClick={() => { localStorage.clear(); navigate('/welcome') }} className="underline" style={{ color: 'var(--primary)' }}>Yes, start over</button>
              <button onClick={() => setConfirmReset(false)} className="underline">Cancel</button>
            </span>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="text-sm hover:opacity-75 transition-opacity" style={{ color: 'var(--text-soft)' }}>Start over</button>
          )}
          <p className="text-xs mt-3" style={{ color: 'var(--text-soft)', opacity: 0.8 }}>Your plan is saved privately on this device.</p>
        </div>
      </motion.div>
    </div>
  )
}
