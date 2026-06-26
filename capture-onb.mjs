import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'fs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = '/Users/aadyajain/Desktop/Logr/shots/'
mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  args: ['--no-sandbox', '--hide-scrollbars'],
})
const page = await browser.newPage()

let up = false
for (let i = 0; i < 30 && !up; i++) {
  try { await page.goto('http://localhost:5180/welcome', { waitUntil: 'domcontentloaded', timeout: 3000 }); up = true }
  catch { await sleep(1000) }
}
if (!up) { console.log('server down'); await browser.close(); process.exit(1) }

// pretty backdrop + ensure onboarding shows
await page.evaluate(() => { localStorage.setItem('logr-scene', 'sunset'); localStorage.removeItem('logr-onboarded') })
await page.goto('http://localhost:5180/welcome', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => document.querySelector('#root') && document.querySelector('#root').innerText.length > 30, { timeout: 8000 })
await page.evaluate(() => document.fonts && document.fonts.ready)

const click = async (text) => page.evaluate((t) => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().includes(t))
  if (b) b.click()
}, text)

await sleep(1300); await page.screenshot({ path: OUT + 'onb-0-welcome.png' }); console.log('welcome')
await click('Continue'); await sleep(700)
await click('Land an ML internship'); await sleep(500)
await page.screenshot({ path: OUT + 'onb-1-goal.png' }); console.log('goal')
await click('Continue'); await sleep(700)
await page.screenshot({ path: OUT + 'onb-2-time.png' }); console.log('time')
await click('Continue'); await sleep(600)
await page.screenshot({ path: OUT + 'onb-3-calendar.png' }); console.log('calendar')
await click('Continue'); await sleep(600) // -> material
await click('Continue'); await sleep(600) // -> ready
await page.screenshot({ path: OUT + 'onb-5-ready.png' }); console.log('ready')

await browser.close()
console.log('done')
