import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'fs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = '/Users/aadyajain/Desktop/Logr/shots/'
mkdirSync(OUT, { recursive: true })

const scenes = ['sunset', 'winter', 'rainy', 'lakeside', 'lavender', 'ocean']
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  args: ['--no-sandbox', '--hide-scrollbars'],
})
const page = await browser.newPage()

let up = false
for (let i = 0; i < 30 && !up; i++) {
  try { await page.goto('http://localhost:5180', { waitUntil: 'domcontentloaded', timeout: 3000 }); up = true }
  catch { await sleep(1000) }
}
if (!up) { console.log('server never came up'); await browser.close(); process.exit(1) }

for (const s of scenes) {
  await page.evaluate((x) => localStorage.setItem('logr-scene', x), s)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('#root') && document.querySelector('#root').innerText.length > 30, { timeout: 8000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await sleep(1500) // let the scene breathe into frame
  await page.screenshot({ path: OUT + s + '.png' })
  console.log('saved', s)
}
await browser.close()
console.log('done →', OUT)
