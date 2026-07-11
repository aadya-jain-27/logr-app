import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = '/Users/aadyajain/Desktop/Logr/shots/report/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1440, height: 940, deviceScaleFactor: 2 }, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.goto('http://localhost:5180/welcome', { waitUntil: 'domcontentloaded' })
await page.evaluate(() => { localStorage.setItem('logr-scene', 'sunset'); localStorage.removeItem('logr-onboarded') })
await page.goto('http://localhost:5180/welcome', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => (document.querySelector('#root')?.innerText || '').length > 30, { timeout: 8000 })
const cont = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Continue') && !x.disabled); if (b) b.click() })
const fillPh = (ph, val) => page.evaluate(({ ph, val }) => { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; const el = [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').includes(ph)); if (el) { s.call(el, val); el.dispatchEvent(new Event('input', { bubbles: true })) } }, { ph, val })

await sleep(800); await fillPh('Your name', 'Aadya'); await sleep(300)
await page.screenshot({ path: OUT + 'onb-welcome.png' })                       // step 0
await cont(); await sleep(700); await fillPh('Type your goal', 'Land a machine learning internship'); await sleep(300)
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'In 6 months'); if (b) b.click() }); await sleep(300)
await page.screenshot({ path: OUT + 'onb-goal.png' })                          // step 1
await cont(); await sleep(700); await page.screenshot({ path: OUT + 'onb-time.png' })    // step 2
await cont(); await sleep(700)
await page.evaluate(() => { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; const el = [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').includes('Maths midterm')); if (el) { s.call(el, 'DBMS Midterm'); el.dispatchEvent(new Event('input', { bubbles: true })) } const dt = document.querySelector('input[type=date]'); if (dt) { const d = new Date(); d.setDate(d.getDate() + 12); const v = d.toISOString().slice(0, 10); s.call(dt, v); dt.dispatchEvent(new Event('input', { bubbles: true })) } })
await sleep(300); await page.evaluate(() => { const b = [...document.querySelectorAll('button.btn-primary')].find((x) => x.className.includes('w-10')); if (b) b.click() }); await sleep(400)
await page.screenshot({ path: OUT + 'onb-commitments.png' })                    // step 3
await cont(); await sleep(700)
await fillPh('Andrew Ng', 'python pandas full course')
await fillPh('YouTube or course link', 'https://youtu.be/aircAruvnKk'); await sleep(300)
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Detect length')); if (b) b.click() })
await page.waitForFunction(() => { const el = [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').includes('~hrs')); return el && el.value.trim().length > 0 }, { timeout: 30000 }).catch(() => {})
await sleep(700); await page.screenshot({ path: OUT + 'onb-resources.png' })     // step 4
await page.evaluate(() => { const b = [...document.querySelectorAll('button.btn-primary')].find((x) => x.className.includes('w-10')); if (b) b.click() }); await sleep(500)
await cont(); await sleep(800); await page.screenshot({ path: OUT + 'onb-ready.png' })   // step 5
console.log('onboarding shots done')
await browser.close()
