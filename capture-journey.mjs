import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = '/Users/aadyajain/Desktop/Logr/shots/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1440, height: 920, deviceScaleFactor: 2 }, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.goto('http://localhost:5180/today', { waitUntil: 'domcontentloaded' })
await page.evaluate(() => {
  localStorage.setItem('logr-scene', 'lavender')
  localStorage.setItem('logr-onboarded', '1')
  localStorage.setItem('logr-profile', JSON.stringify({ name: 'Aadya', goal: 'Land an ML internship', weekday: 2, weekend: 4 }))
  const h = {}
  const set = (day, done, minutes) => { const d = new Date(); d.setDate(day); h[d.toDateString()] = { done, total: done + 1, minutes } }
  ;[[3, 2, 75], [4, 3, 120], [5, 1, 40], [9, 2, 90], [10, 2, 80], [12, 1, 35], [16, 3, 110], [17, 1, 30], [18, 2, 85], [23, 2, 95], [24, 2, 70], [25, 3, 100], [26, 2, 60]].forEach(([d, n, m]) => set(d, n, m))
  localStorage.setItem('logr-history', JSON.stringify(h))
})
await page.goto('http://localhost:5180/journey', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => document.querySelector('#root') && document.querySelector('#root').innerText.length > 40, { timeout: 8000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await sleep(1500)
await page.screenshot({ path: OUT + 'journey.png' })
console.log('saved journey')
await browser.close()
