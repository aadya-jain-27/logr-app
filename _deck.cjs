const pptxgen = require('pptxgenjs')
const S = '/Users/aadyajain/Desktop/Logr/shots/report/'
const p = new pptxgen()
p.layout = 'LAYOUT_WIDE' // 13.33 x 7.5
p.author = 'Aadya Jain'
p.title = 'Logr Internship Report'

const PLUM = '2B2340', TERRA = 'CF6A45', SAGE = '6E8B7B', INK = '2B2340', MUTED = '6E6A7A', PAPER = 'FFFFFF', CARD = 'F4F1F8'
const HEAD = 'Cambria', BODY = 'Calibri'
const IMGR = 940 / 1440 // screenshot aspect (h/w)

const bg = (s, c) => { s.background = { color: c } }
const framed = (s, img, x, y, w) => {
  const h = w * IMGR
  s.addShape('roundRect', { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, rectRadius: 0.1, fill: { color: 'FFFFFF' }, line: { color: 'E7E2EC', width: 1 }, shadow: { type: 'outer', color: '3A2E4C', opacity: 0.22, blur: 10, offset: 3, angle: 90 } })
  s.addImage({ path: S + img, x, y, w, h, rounding: true })
  return h
}
const kicker = (s, text, x, y, color) => s.addText(text.toUpperCase(), { x, y, w: 7, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: color || TERRA, charSpacing: 2, margin: 0 })
const title = (s, text, x, y, w, color) => s.addText(text, { x, y, w: w || 8, h: 0.9, fontFace: HEAD, fontSize: 32, bold: true, color: color || INK, margin: 0 })
const para = (s, text, x, y, w, opts) => s.addText(text, Object.assign({ x, y, w, h: 3, fontFace: BODY, fontSize: 15, color: INK, align: 'left', valign: 'top', lineSpacingMultiple: 1.12, margin: 0 }, opts || {}))
const bullets = (s, items, x, y, w, opts) => s.addText(items.map((t, i) => ({ text: t, options: { bullet: { indent: 16 }, breakLine: true, paraSpaceAfter: (opts && opts.gap) || 10 } })), Object.assign({ x, y, w, h: 4.6, fontFace: BODY, fontSize: (opts && opts.size) || 15, color: INK, valign: 'top', margin: 0 }, (opts && opts.box) || {}))

// small round badge with a number, our repeated motif
const badge = (s, n, x, y, color) => {
  s.addShape('ellipse', { x, y, w: 0.42, h: 0.42, fill: { color: color || TERRA } })
  s.addText(String(n), { x, y, w: 0.42, h: 0.42, align: 'center', valign: 'middle', fontFace: BODY, fontSize: 15, bold: true, color: 'FFFFFF', margin: 0 })
}

/* 1. TITLE */
let s = p.addSlide(); bg(s, PLUM)
s.addShape('roundRect', { x: 0.9, y: 0.85, w: 0.5, h: 0.5, rectRadius: 0.12, fill: { color: TERRA } })
s.addText('Logr', { x: 1.5, y: 0.82, w: 3, h: 0.55, fontFace: HEAD, fontSize: 26, bold: true, color: 'FFFFFF', margin: 0 })
s.addText('Your goal, broken into today.', { x: 0.9, y: 2.5, w: 6.6, h: 1.4, fontFace: HEAD, fontSize: 40, bold: true, color: 'FFFFFF', margin: 0, lineSpacingMultiple: 1.0 })
s.addText('An AI study and career planner, built as a full stack web application.', { x: 0.9, y: 3.95, w: 6.2, h: 0.7, fontFace: BODY, fontSize: 16, color: 'D9D2E6', margin: 0 })
s.addText([
  { text: 'Submitted by: ', options: { bold: true } }, { text: 'Aadya Jain', options: {} }, { text: '     Under the guidance of: ', options: { bold: true } }, { text: 'Neha Jain', options: { breakLine: true } },
  { text: 'SRM Institute of Science and Technology, KTR', options: { breakLine: true } },
  { text: 'Sopra Steria, Noida     25 June 2026 to 25 July 2026', options: {} },
], { x: 0.9, y: 5.5, w: 7, h: 1.4, fontFace: BODY, fontSize: 13, color: 'CFC8DE', margin: 0, lineSpacingMultiple: 1.3 })
framed(s, 'today.png', 8.05, 1.15, 4.5)

const section = (n, ttl, sub) => {
  const sl = p.addSlide(); bg(sl, PAPER)
  kicker(sl, ttl, 0.9, 0.62)
  title(sl, ttl, 0.9, 0.95, 11.5)
  if (sub) sl.addText(sub, { x: 0.9, y: 1.72, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 14, italic: true, color: MUTED, margin: 0 })
  return sl
}

/* 2. ACKNOWLEDGEMENT */
s = section(2, 'Acknowledgement')
para(s, 'I would like to express my sincere gratitude to everyone who supported the successful completion of the Logr project. My heartfelt thanks to my guide, Neha Jain, and to the mentors and team at Sopra Steria, Noida, for their guidance and encouragement throughout the internship. I am also grateful for the open source tools, APIs, and developer communities that made this work possible, and for the opportunity to apply and grow my skills during this experience.', 0.9, 2.1, 7.4, { fontSize: 17, lineSpacingMultiple: 1.3 })
framed(s, 'path.png', 8.7, 2.0, 3.9)

/* 3. CERTIFICATE */
s = section(3, 'Certificate')
s.addShape('roundRect', { x: 2.4, y: 2.2, w: 8.5, h: 4.3, rectRadius: 0.1, fill: { color: CARD }, line: { color: 'D9D2E6', width: 1, dashType: 'dash' } })
s.addText('Internship completion certificate to be attached here.', { x: 2.4, y: 4.1, w: 8.5, h: 0.6, align: 'center', fontFace: BODY, fontSize: 16, italic: true, color: MUTED, margin: 0 })

/* 4. ABOUT SOPRA STERIA */
s = section(4, 'About Sopra Steria')
bullets(s, [
  'A European leader in technology, consulting, and digital services.',
  'Formed in 2014 from the merger of Sopra Group and Groupe Steria.',
  'Headquartered in France, operating in around thirty countries, with a large presence in India including Noida.',
  'Offers consulting, software development, systems integration, and digital transformation.',
  'Serves banking, public sector, aerospace, and other industries.',
  'Focused on delivering real business value through technology.',
], 0.9, 2.15, 7.5, { size: 16, gap: 12 })
framed(s, 'settings.png', 8.9, 2.0, 3.7)

/* 5. TABLE OF CONTENTS */
s = section(5, 'Table of Contents')
const toc = ['Abstract', 'Introduction', 'Software Used', 'Purpose of the Project', 'Scope of the Project', 'Features of the Project', 'Application of the Project', 'System Architecture', 'Workflow', 'User Interface Overview', 'Challenges Faced', 'Deployment', 'Conclusion', 'Future Scope', 'Preview Link', 'Bibliography']
s.addText(toc.slice(0, 8).map((t, i) => ({ text: `${i + 1}.  ${t}`, options: { breakLine: true, paraSpaceAfter: 12 } })), { x: 1.1, y: 2.2, w: 5.4, h: 4.5, fontFace: BODY, fontSize: 17, color: INK, margin: 0 })
s.addText(toc.slice(8).map((t, i) => ({ text: `${i + 9}.  ${t}`, options: { breakLine: true, paraSpaceAfter: 12 } })), { x: 6.9, y: 2.2, w: 5.4, h: 4.5, fontFace: BODY, fontSize: 17, color: INK, margin: 0 })

/* 6. ABSTRACT */
s = section(6, 'Abstract')
para(s, 'Logr is an AI powered study and career planner that turns a big goal into a small, doable plan for today. Built as a full stack web application during the internship, it uses a large language model to plan and adapt a student’s day around their real available time, deadlines, and study materials. The project focuses on reducing student overwhelm through a calm, one day at a time experience, while still holding the full long term roadmap in the background.', 0.9, 2.15, 7.4, { fontSize: 17, lineSpacingMultiple: 1.3 })
framed(s, 'plan-month.png', 8.7, 2.0, 3.9)

/* 7. INTRODUCTION */
s = section(7, 'Introduction')
para(s, 'Students often set big goals but struggle to turn them into consistent daily action. To do apps and generic chatbots tend to produce overwhelming, static plans that do not adapt when life happens. Logr takes a different approach. You give it one goal, your real available time, and what you are studying from. An AI then plans the next few tasks for today, builds a full roadmap across your timeframe, and lays it out on a calendar you can trust. The interface is a calm, living world, so studying feels less like a chore and more like a gentle habit.', 0.9, 2.15, 7.4, { fontSize: 16, lineSpacingMultiple: 1.3 })
framed(s, 'today.png', 8.7, 2.0, 3.9)

/* 8. SOFTWARE USED */
s = section(8, 'Software Used')
const col = (x, head, items) => {
  s.addShape('roundRect', { x, y: 2.15, w: 3.7, h: 4.3, rectRadius: 0.08, fill: { color: CARD } })
  s.addText(head, { x: x + 0.25, y: 2.4, w: 3.2, h: 0.5, fontFace: HEAD, fontSize: 17, bold: true, color: TERRA, margin: 0 })
  s.addText(items.map((t) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: true, paraSpaceAfter: 9 } })), { x: x + 0.25, y: 2.95, w: 3.25, h: 3.3, fontFace: BODY, fontSize: 13.5, color: INK, margin: 0 })
}
col(0.9, 'Frontend', ['React 19', 'Vite build tool', 'Tailwind CSS v4', 'React Router', 'Framer Motion'])
col(4.82, 'Backend and AI', ['Vercel serverless functions (Node)', 'Google Gemini API', 'Model auto discovery and fallback', 'Strict JSON responses'])
col(8.74, 'Platform and Tools', ['Vercel hosting', 'GitHub version control', 'Web Audio API for sound', 'Gemini file and video parsing'])

/* 9. PURPOSE */
s = section(9, 'Purpose of the Project')
bullets(s, [
  'Turn any long term goal into two to four focused tasks for today.',
  'Size each day to the student’s real available hours and deadlines.',
  'Understand the student’s own materials and pace them sensibly.',
  'Adapt gently: carry over unfinished work and welcome the student back after a gap.',
  'Keep the experience calm and encouraging, showing progress and never absence.',
], 0.9, 2.15, 7.5, { size: 16, gap: 14 })
framed(s, 'path.png', 8.9, 2.0, 3.7)

/* 10. SCOPE */
s = section(10, 'Scope of the Project')
bullets(s, [
  'End to end study planning for any field, not only computer science.',
  'Onboarding, a daily plan, a full roadmap, a calendar, progress, and settings.',
  'AI plans around courses, videos, PDFs and slides, exams, and available time.',
  'Runs entirely in the browser and is deployed publicly, with no account needed.',
  'Designed to be extensible for accounts, sync, and more fields in the future.',
], 0.9, 2.15, 7.5, { size: 16, gap: 14 })
framed(s, 'plan-week.png', 8.9, 2.0, 3.7)

/* 11. FEATURES */
s = section(11, 'Features of the Project')
const feats = [
  ['Today’s plan', 'Two to four tasks sized to your real time, with a where to start tip.'],
  ['The Path roadmap', 'Your goal broken into phases and projects to build, grounded in your resources.'],
  ['Smart calendar', 'Month and week views with exams flagged and your pacing honoured.'],
  ['Resource intelligence', 'Reads a YouTube video’s length and topics, and parses PDFs and slides.'],
  ['Focus and sound', 'A background safe focus timer and calm, per world ambient sound.'],
  ['Adaptive and honest', 'Carry over, welcome back, lighter exam days, and progress that never shames.'],
]
feats.forEach((f, i) => {
  const x = 0.9 + (i % 2) * 6.1, y = 2.15 + Math.floor(i / 2) * 1.5
  s.addShape('roundRect', { x, y, w: 5.85, h: 1.32, rectRadius: 0.08, fill: { color: CARD } })
  badge(s, i + 1, x + 0.28, y + 0.28, i % 2 === 0 ? TERRA : SAGE)
  s.addText(f[0], { x: x + 0.95, y: y + 0.18, w: 4.7, h: 0.4, fontFace: HEAD, fontSize: 15.5, bold: true, color: INK, margin: 0 })
  s.addText(f[1], { x: x + 0.95, y: y + 0.58, w: 4.7, h: 0.7, fontFace: BODY, fontSize: 12.5, color: MUTED, margin: 0, lineSpacingMultiple: 1.05 })
})

/* 12. APPLICATION */
s = section(12, 'Application of the Project')
bullets(s, [
  'Any student working toward a goal: placements, GATE, semester exams, or a new skill.',
  'Self learners who want structure and pacing without feeling overwhelmed.',
  'Anyone preparing from their own courses, videos, and notes.',
  'Students who value a calm, private, on device study companion.',
], 0.9, 2.15, 7.5, { size: 16.5, gap: 16 })
framed(s, 'journey.png', 8.9, 2.0, 3.7)

/* 13. SYSTEM ARCHITECTURE */
s = section(13, 'System Architecture', 'How a request flows, with the API key kept safely on the server.')
const boxW = 3.0, boxH = 1.5, by = 3.3
const abox = (x, label, sub, color) => {
  s.addShape('roundRect', { x, y: by, w: boxW, h: boxH, rectRadius: 0.1, fill: { color: color }, shadow: { type: 'outer', color: '3A2E4C', opacity: 0.18, blur: 8, offset: 2, angle: 90 } })
  s.addText(label, { x, y: by + 0.35, w: boxW, h: 0.5, align: 'center', fontFace: HEAD, fontSize: 16, bold: true, color: 'FFFFFF', margin: 0 })
  s.addText(sub, { x: x + 0.1, y: by + 0.85, w: boxW - 0.2, h: 0.5, align: 'center', fontFace: BODY, fontSize: 11, color: 'EDE8F2', margin: 0 })
}
abox(0.95, 'Browser', 'React app, the calm UI', PLUM)
abox(5.15, 'Serverless API', '/api on Vercel', TERRA)
abox(9.35, 'Gemini API', 'plans and parsing', SAGE)
s.addShape('line', { x: 3.95, y: by + boxH / 2, w: 1.2, h: 0, line: { color: MUTED, width: 2, endArrowType: 'triangle' } })
s.addShape('line', { x: 8.15, y: by + boxH / 2, w: 1.2, h: 0, line: { color: MUTED, width: 2, endArrowType: 'triangle' } })
s.addText('The API key lives only in server side environment variables, never in the browser. The browser keeps your plan and progress on your own device.', { x: 0.95, y: 5.4, w: 11.4, h: 0.8, align: 'center', fontFace: BODY, fontSize: 14, italic: true, color: MUTED, margin: 0 })

/* 14. WORKFLOW */
s = section(14, 'Workflow')
const steps = [
  ['Set your goal', 'Tell Logr your goal, your real available time, and what you are studying from.'],
  ['Get your plan', 'An AI builds today’s few tasks and a full roadmap across your timeframe.'],
  ['Study and add', 'Check tasks off, and add your own things for the day whenever you need.'],
  ['Miss a day', 'Logr gently reshuffles the rest, with no shame and no pile up.'],
  ['See and track', 'View the plan on a calendar and watch your progress add up.'],
]
steps.forEach((st, i) => {
  const y = 2.2 + i * 0.92
  badge(s, i + 1, 0.95, y, i % 2 === 0 ? TERRA : SAGE)
  s.addText([{ text: st[0] + '.  ', options: { bold: true, color: INK } }, { text: st[1], options: { color: MUTED } }], { x: 1.6, y: y - 0.03, w: 6.6, h: 0.55, fontFace: BODY, fontSize: 15, valign: 'middle', margin: 0 })
})
framed(s, 'plan-month.png', 8.7, 2.15, 3.9)

/* UI OVERVIEW */
const uiSlide = (ttl, shots, caption) => {
  const sl = p.addSlide(); bg(sl, PAPER)
  kicker(sl, 'User Interface', 0.9, 0.55)
  title(sl, ttl, 0.9, 0.88, 11.5)
  if (shots.length === 1) { framed(sl, shots[0], 3.35, 1.95, 6.6) }
  else { framed(sl, shots[0], 0.9, 2.05, 5.75); framed(sl, shots[1], 6.9, 2.05, 5.75) }
  if (caption) sl.addText(caption, { x: 0.9, y: 6.75, w: 11.5, h: 0.5, align: 'center', fontFace: BODY, fontSize: 13, italic: true, color: MUTED, margin: 0 })
  return sl
}
uiSlide('Onboarding: a calm setup', ['onb-welcome.png', 'onb-goal.png'], 'Pick a world and name yourself, then set one clear goal and a target.')
uiSlide('Onboarding: time, exams, and resources', ['onb-time.png', 'onb-resources.png'], 'Give your real hours and exams, then add resources. Paste a link and Logr detects its length and topics.')
uiSlide('Onboarding: ready to begin', ['onb-ready.png'], 'A calm summary before your first day. Everything is saved privately on your device.')
uiSlide('Today', ['today.png'], 'A few tasks sized to your time, a note that your pacing was honoured, and space to add your own.')
uiSlide('The Path', ['path.png'], 'Your goal broken into clear phases and projects to build, with a nudge to push them to GitHub.')
uiSlide('The Calendar', ['plan-month.png', 'plan-week.png'], 'Month and week views. Exams are flagged and a resource spread across weeks shows on each day.')
uiSlide('Journey and Settings', ['journey.png', 'settings.png'], 'Celebrate progress you actually made, and edit your goal, resources, and exams any time.')
uiSlide('Share and Focus', ['share.png', 'focus.png'], 'A clean shareable plan card, and a focus timer that keeps time even in the background.')

/* CHALLENGES */
s = section(90, 'Challenges Faced')
bullets(s, [
  'Getting reliable, structured output from a language model, solved with strict JSON schemas and safety guards against duplicates and over long plans.',
  'Free tier model limits and latency, solved with automatic model fallback and fast page parsing for video length.',
  'Serverless limits such as timeouts and request size, solved by tuning the function limits and sending files as compact data.',
  'Balancing depth with calm, solved by holding the full roadmap in the background while showing only today.',
], 0.9, 2.15, 7.6, { size: 15.5, gap: 14 })
framed(s, 'focus.png', 9.0, 2.0, 3.6)

/* DEPLOYMENT */
s = section(91, 'Deployment')
bullets(s, [
  'Hosted on Vercel, serving both the web app and the serverless API.',
  'Deploys automatically from the GitHub main branch on every push.',
  'The Gemini API key is stored in server side environment variables, never exposed to the browser.',
  'Serverless functions are tuned to allow the AI enough time to respond.',
], 0.9, 2.15, 7.6, { size: 16, gap: 14 })
s.addShape('roundRect', { x: 0.9, y: 5.7, w: 7.6, h: 0.85, rectRadius: 0.1, fill: { color: CARD } })
s.addText([{ text: 'Live link:  ', options: { bold: true, color: INK } }, { text: 'https://uselogr.vercel.app', options: { color: TERRA, bold: true } }], { x: 1.2, y: 5.9, w: 7, h: 0.5, fontFace: BODY, fontSize: 16, valign: 'middle', margin: 0 })
framed(s, 'plan-week.png', 9.0, 2.0, 3.6)

/* CONCLUSION */
s = p.addSlide(); bg(s, PLUM)
kicker(s, 'Conclusion', 0.9, 0.9, TERRA)
title(s, 'Conclusion', 0.9, 1.25, 11, 'FFFFFF')
para(s, 'Logr shows that an AI planner can be genuinely helpful and calm at the same time. It turns a big goal into a trustworthy daily habit that adapts to real life, respects the student’s time, and celebrates progress instead of pointing at gaps. The internship delivered a complete, deployed product along with hands on experience across the full stack and applied AI.', 0.9, 2.5, 7.6, { fontSize: 18, color: 'E9E4F2', lineSpacingMultiple: 1.35 })
framed(s, 'today.png', 8.7, 2.1, 3.9)

/* FUTURE SCOPE */
s = section(93, 'Future Scope')
bullets(s, [
  'Accounts and cloud sync so a plan follows you across devices.',
  'Curated career roadmaps for more fields beyond technology.',
  'Recurring commitments and a native mobile app.',
  'Learning the student’s real pace over time for smarter estimates.',
  'Support for larger uploads and richer ambient audio.',
], 0.9, 2.15, 7.6, { size: 16.5, gap: 15 })
framed(s, 'journey.png', 9.0, 2.0, 3.6)

/* PREVIEW LINK */
s = p.addSlide(); bg(s, PLUM)
s.addText('Try Logr', { x: 0.9, y: 2.2, w: 11, h: 1, fontFace: HEAD, fontSize: 40, bold: true, color: 'FFFFFF', align: 'center', margin: 0 })
s.addShape('roundRect', { x: 3.9, y: 3.6, w: 5.5, h: 1.0, rectRadius: 0.5, fill: { color: TERRA } })
s.addText('uselogr.vercel.app', { x: 3.9, y: 3.6, w: 5.5, h: 1.0, align: 'center', valign: 'middle', fontFace: BODY, fontSize: 22, bold: true, color: 'FFFFFF', margin: 0 })
s.addText('No login needed. Your plan stays private on your device.', { x: 0.9, y: 4.9, w: 11, h: 0.5, align: 'center', fontFace: BODY, fontSize: 15, italic: true, color: 'CFC8DE', margin: 0 })

/* BIBLIOGRAPHY */
s = section(95, 'Bibliography')
bullets(s, [
  'React documentation, https://react.dev',
  'Vite documentation, https://vitejs.dev',
  'Tailwind CSS documentation, https://tailwindcss.com/docs',
  'Framer Motion documentation, https://www.framer.com/motion',
  'Google Gemini API documentation, https://ai.google.dev',
  'Vercel documentation, https://vercel.com/docs',
  'Web Audio API, MDN Web Docs, https://developer.mozilla.org',
], 0.9, 2.15, 11.4, { size: 15, gap: 11 })

p.writeFile({ fileName: '/Users/aadyajain/Desktop/Logr Internship Report.pptx' }).then((f) => console.log('WROTE', f))
