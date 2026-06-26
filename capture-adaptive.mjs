import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = '/Users/aadyajain/Desktop/Logr/shots/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 }, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.goto('http://localhost:5180/today', { waitUntil: 'domcontentloaded' })

// Simulate: a plan from 4 days ago with 2 unfinished tasks.
await page.evaluate(() => {
  const past = new Date(); past.setDate(past.getDate() - 4)
  localStorage.setItem('logr-scene', 'lakeside')
  localStorage.setItem('logr-onboarded', '1')
  localStorage.setItem('logr-profile', JSON.stringify({ name: 'Aadya', goal: 'Land an ML internship', deadline: 'In 3 months', weekday: 2, weekend: 4, skipWeekends: false, material: '' }))
  localStorage.setItem('logr-plan', JSON.stringify({
    date: past.toDateString(),
    plan: { goalProgress: 30, pace: 'steady', tasks: [
      { id: 't0', title: 'Finish your overfitting notes', kind: 'Review', source: 'StatQuest', minutes: 30, done: false },
      { id: 't1', title: 'Two Sum on LeetCode', kind: 'Solve', source: 'LeetCode', minutes: 30, done: false },
      { id: 't2', title: 'Read about gradient descent', kind: 'Read', source: 'a blog', minutes: 30, done: true },
    ] },
  }))
})
await page.goto('http://localhost:5180/today', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => document.querySelector('#root') && document.querySelector('#root').innerText.length > 40, { timeout: 8000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await sleep(16000)
await page.screenshot({ path: OUT + 'adaptive.png' })
console.log('saved adaptive')
await browser.close()
