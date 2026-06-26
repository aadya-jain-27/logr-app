import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = '/Users/aadyajain/Desktop/Logr/shots/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 }, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.goto('http://localhost:5180/today', { waitUntil: 'domcontentloaded' })
await page.evaluate(() => {
  localStorage.setItem('logr-scene', 'sunset')
  localStorage.setItem('logr-onboarded', '1')
  localStorage.removeItem('logr-plan')
  localStorage.setItem('logr-profile', JSON.stringify({ name: 'Aadya', goal: 'Land an ML internship', deadline: 'In 3 months', weekday: 2, weekend: 4, skipWeekends: false, material: '', scene: 'sunset' }))
})
await page.goto('http://localhost:5180/today', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => document.querySelector('#root') && document.querySelector('#root').innerText.length > 40, { timeout: 8000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await sleep(15000)
await page.screenshot({ path: OUT + 'today-ai.png' })
console.log('saved today-ai')
await browser.close()
