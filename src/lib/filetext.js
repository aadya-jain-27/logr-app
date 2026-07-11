// Reads a PDF or PPTX in the browser and returns its text plus a page or slide count.
// We send only this text to the server, so there is no upload size limit: a large file's
// text is small. The libraries load lazily from a CDN, so they never bloat the app bundle.

const PDFJS_VERSION = '4.7.76'
let pdfjs = null

async function loadPdfjs() {
  if (pdfjs) return pdfjs
  pdfjs = await import(/* @vite-ignore */ `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`)
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`
  return pdfjs
}

const MAX_TEXT = 14000

export async function extractFileText(file) {
  const name = file.name || 'document'
  const isPdf = /\.pdf$/i.test(name) || file.type === 'application/pdf'
  const isPpt = /\.pptx?$/i.test(name) || /presentation/.test(file.type || '')

  if (isPdf) {
    const lib = await loadPdfjs()
    const data = new Uint8Array(await file.arrayBuffer())
    const doc = await lib.getDocument({ data }).promise
    const pageCount = doc.numPages
    let text = ''
    for (let i = 1; i <= Math.min(pageCount, 40) && text.length < MAX_TEXT; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((it) => it.str).join(' ') + '\n'
    }
    return { text: text.slice(0, MAX_TEXT), pageCount, name }
  }

  if (isPpt) {
    const { unzipSync, strFromU8 } = await import(/* @vite-ignore */ 'https://unpkg.com/fflate@0.8.2/esm/browser.js')
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()))
    const slides = Object.keys(files).filter((k) => /ppt\/slides\/slide\d+\.xml$/.test(k)).sort()
    let text = ''
    for (const k of slides) {
      const xml = strFromU8(files[k])
      text += (xml.match(/<a:t>([^<]*)<\/a:t>/g) || []).map((m) => m.replace(/<[^>]+>/g, '')).join(' ') + '\n'
      if (text.length > MAX_TEXT) break
    }
    return { text: text.slice(0, MAX_TEXT), pageCount: slides.length, name }
  }

  return null
}
