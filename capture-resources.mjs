import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = '/Users/aadyajain/Desktop/Logr/shots/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 }, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.goto('http://localhost:5180/welcome', { waitUntil: 'domcontentloaded' })
await page.evaluate(() => { localStorage.setItem('logr-scene', 'lakeside'); localStorage.removeItem('logr-onboarded') })
await page.goto('http://localhost:5180/welcome', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => document.querySelector('#root')?.innerText.length > 30, { timeout: 8000 })
await page.evaluate(() => document.fonts && document.fonts.ready)

const cont = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Continue') && !x.disabled); if (b) b.click() })
const fill = (idx, val) => page.evaluate(({ idx, val }) => {
  const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  const el = document.querySelectorAll('input.field')[idx]; if (el) { s.call(el, val); el.dispatchEvent(new Event('input', { bubbles: true })) }
}, { idx, val })
const addBtn = () => page.evaluate(() => { const b = [...document.querySelectorAll('button.btn-primary')].find((x) => x.className.includes('w-10')); if (b) b.click() })

await sleep(800); await cont()                 // 0 -> 1
await sleep(900); await fill(0, 'Land an ML internship') // goal
await sleep(400); await cont()                 // 1 -> 2
await sleep(900); await cont()                 // 2 -> 3
await sleep(900); await cont()                 // 3 -> 4 (resources)
await sleep(900)
await fill(0, 'Andrew Ng ML Course 1 (Coursera)'); await fill(1, '30h'); await sleep(300); await addBtn()
await sleep(500)
await fill(0, 'Striver A2Z DSA Sheet'); await sleep(300); await addBtn()
await sleep(700)
await page.screenshot({ path: OUT + 'onb-resources.png' })
console.log('saved onb-resources, heading:', await page.evaluate(() => document.querySelector('h1')?.textContent))
await browser.close()
