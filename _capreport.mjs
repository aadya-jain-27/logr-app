import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = '/Users/aadyajain/Desktop/Logr/shots/report/'
import { mkdirSync } from 'fs'; mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1440, height: 940, deviceScaleFactor: 2 }, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()

const seed = () => page.evaluate(() => {
  const pad = (n) => String(n).padStart(2, '0')
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
  const now = new Date()
  const start = addD(now, -4) // day 5 of 180
  const resources = [
    { name: 'Andrew Ng ML Specialization', hours: '40h', url: '', notes: 'divide across 3 weeks', file: null },
    { name: '3Blue1Brown Neural Networks', hours: '19m', url: 'https://youtu.be/aircAruvnKk', notes: '', file: { name: 'But what is a neural network?', kind: 'video', topics: ['neural networks', 'gradient descent'] } },
    { name: 'DBMS unit 3 notes', hours: '', url: '', notes: '', file: { name: 'DBMS unit 3 notes', pageCount: 24, topics: ['normalization', 'transactions', 'indexing'] } },
  ]
  const profile = { name: 'Aadya', goal: 'Land a machine learning internship', deadline: 'In 6 months', weekday: 2, weekend: 4, skipWeekends: false, resources, commitments: [{ name: 'DBMS Midterm', date: ymd(addD(now, 11)), type: 'Exam' }, { name: 'OS Assignment', date: ymd(addD(now, 19)), type: 'Assignment' }], scene: 'sunset' }
  localStorage.setItem('logr-profile', JSON.stringify(profile)); localStorage.setItem('logr-onboarded', '1'); localStorage.setItem('logr-scene', 'sunset')
  const rSig = resources.map((r) => `${r.name}~${r.hours || ''}~${r.notes || ''}~${r.done ? 'd' : ''}`).join('|')
  const planSig = `Land a machine learning internship::In 6 months::${rSig}::2::4::`
  const plan = { tasks: [
    { title: 'Watch and take notes on the next Andrew Ng ML lesson', kind: 'Watch and note', source: 'Coursera', minutes: 50, tip: null },
    { title: 'Watch and note the 3Blue1Brown neural networks video', kind: 'Watch and note', source: '3Blue1Brown', minutes: 19, tip: null },
    { title: 'Read and review normalization from your DBMS notes', kind: 'Review', source: 'DBMS unit 3 notes', minutes: 40, tip: null },
  ], goalProgress: 18, pace: 'nicely paced', acknowledgements: ['Dividing the Andrew Ng ML Specialization across three weeks, as you asked.'] }
  localStorage.setItem('logr-plan', JSON.stringify({ date: now.toDateString(), sig: planSig, plan }))
  const roadmap = { summary: 'A calm six month path from machine learning foundations to a portfolio and interview prep, built around your own resources.', totalDays: 180,
    phases: [
      { title: 'Python, Data Handling, and Foundations', dayStart: 1, dayEnd: 30, focus: 'Core Python, pandas, and the maths intuition', resources: ['Andrew Ng ML Specialization', '3Blue1Brown Neural Networks'] },
      { title: 'Core Machine Learning', dayStart: 31, dayEnd: 80, focus: 'Supervised learning and your first models', resources: ['Andrew Ng ML Specialization', 'Scikit learn'] },
      { title: 'Projects and Feature Engineering', dayStart: 81, dayEnd: 130, focus: 'Build real projects that prove the skill', resources: ['Kaggle', 'Hands On ML'] },
      { title: 'Deep Learning', dayStart: 131, dayEnd: 160, focus: 'Neural networks and a second project', resources: ['3Blue1Brown Neural Networks', 'PyTorch'] },
      { title: 'Interview Preparation', dayStart: 161, dayEnd: 180, focus: 'DSA practice and applications', resources: ['LeetCode', 'Cracking the Coding Interview'] },
    ],
    schedule: [ { resource: 'Andrew Ng ML Specialization', dayStart: 1, dayEnd: 21 }, { resource: '3Blue1Brown Neural Networks', dayStart: 1, dayEnd: 1 }, { resource: 'DBMS unit 3 notes', dayStart: 5, dayEnd: 9 } ],
    projects: [
      { title: 'Housing Price Predictor', what: 'Build a regression model to predict housing prices from real data.', proves: 'Supervised learning and data preprocessing' },
      { title: 'Image Classifier', what: 'Train a small neural network to recognise images.', proves: 'Deep learning and model evaluation' },
      { title: 'Sentiment Analyzer', what: 'Classify product reviews as positive or negative.', proves: 'An end to end NLP workflow' },
    ], githubNote: 'Push each project to GitHub so your progress is visible proof of your skills.' }
  localStorage.setItem('logr-roadmap', JSON.stringify({ sig: `Land a machine learning internship::In 6 months::${rSig}`, goal: profile.goal, startDate: start.toDateString(), roadmap }))
  localStorage.setItem('logr-extras', JSON.stringify({ [now.toDateString()]: [{ id: 'e1', title: 'Revise OS notes for tomorrow', minutes: 0, done: false }] }))
  const hist = {}
  for (let i = 1; i <= 14; i++) { const d = addD(now, -i); if (i % 4 !== 0) hist[d.toDateString()] = { done: 2 + (i % 3), total: 3, minutes: 55 + (i * 7) % 70 } }
  localStorage.setItem('logr-history', JSON.stringify(hist))
})

const shot = async (path, name) => { await page.goto('http://localhost:5180' + path, { waitUntil: 'domcontentloaded' }); await sleep(1600); await page.screenshot({ path: OUT + name }) }

await page.goto('http://localhost:5180/', { waitUntil: 'domcontentloaded' }); await seed()
await shot('/today', 'today.png')
await shot('/path', 'path.png')
await page.goto('http://localhost:5180/plan', { waitUntil: 'domcontentloaded' }); await sleep(1600); await page.screenshot({ path: OUT + 'plan-month.png' })
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'week'); if (b) b.click() }); await sleep(1000); await page.screenshot({ path: OUT + 'plan-week.png' })
await shot('/journey', 'journey.png')
await page.goto('http://localhost:5180/settings', { waitUntil: 'domcontentloaded' }); await sleep(1400); await page.screenshot({ path: OUT + 'settings.png' })
await shot('/share', 'share.png')
// focus timer open
await page.goto('http://localhost:5180/today', { waitUntil: 'domcontentloaded' }); await sleep(1400)
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Focus')); if (b) b.click() }); await sleep(900)
await page.screenshot({ path: OUT + 'focus.png' })
console.log('main app shots done')
await browser.close()
