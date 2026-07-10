// Procedural scene ambience with the Web Audio API. No audio files.
// Rain is pure rain. Every other world is gentle, peaceful music: a soft chord pad
// that hums and breathes, bell chimes here and there, and a quiet wind or water bed.
// Each world sits in its own musical key so they feel distinct.

let ctx = null
let nodes = null
let chimeTimer = null

function noiseBuffer(context, kind) {
  const len = Math.floor(context.sampleRate * 2.5)
  const buffer = context.createBuffer(1, len, context.sampleRate)
  const data = buffer.getChannelData(0)
  if (kind === 'brown') {
    let last = 0
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.2 }
  } else {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  }
  return buffer
}

// pad = the chord that hums, chimes = notes that ring here and there (Hz).
const CONFIG = {
  rainy: { kind: 'rain', noise: 'white', filter: 2200, q: 0.7, noiseGain: 0.11 },
  winter: { kind: 'music', noise: 'brown', filter: 480, q: 0.4, noiseGain: 0.08, swell: { rate: 0.05, depth: 0.4 },
    pad: [130.81, 196.00, 261.63], chimes: [261.63, 293.66, 392.00, 523.25], chimeEvery: [8000, 15000], padGain: 0.05, chimeGain: 0.08 },
  lakeside: { kind: 'music', noise: 'brown', filter: 700, q: 0.6, noiseGain: 0.06, swell: { rate: 0.12, depth: 0.4 },
    pad: [261.63, 329.63, 392.00], chimes: [523.25, 587.33, 659.25, 783.99, 880.00], chimeEvery: [6000, 12000], padGain: 0.045, chimeGain: 0.07 },
  sunset: { kind: 'music', noise: 'brown', filter: 820, q: 0.5, noiseGain: 0.05, swell: { rate: 0.05, depth: 0.3 },
    pad: [220.00, 277.18, 329.63], chimes: [440.00, 554.37, 659.25, 880.00], chimeEvery: [6000, 13000], padGain: 0.05, chimeGain: 0.07 },
  lavender: { kind: 'music', noise: 'brown', filter: 760, q: 0.5, noiseGain: 0.05, swell: { rate: 0.10, depth: 0.3 },
    pad: [293.66, 329.63, 440.00], chimes: [587.33, 659.25, 739.99, 880.00], chimeEvery: [6000, 13000], padGain: 0.045, chimeGain: 0.07 },
  ocean: { kind: 'music', noise: 'brown', filter: 500, q: 0.6, noiseGain: 0.13, swell: { rate: 0.08, depth: 0.7 },
    pad: [110.00, 164.81, 220.00], chimes: [220.00, 329.63, 440.00, 659.25], chimeEvery: [9000, 16000], padGain: 0.05, chimeGain: 0.09 },
}

function playChime(freq, gainAmt) {
  if (!ctx || !nodes) return
  const now = ctx.currentTime
  // bell timbre: fundamental plus two quieter harmonics, quick attack, long decay
  ;[[1, 1], [2, 0.4], [3, 0.15]].forEach(([mult, amp]) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq * mult
    const peak = gainAmt * amp
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(peak, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0006, now + 2.6)
    o.connect(g).connect(nodes.master)
    o.start(now)
    o.stop(now + 2.7)
  })
}

function scheduleChime(cfg) {
  const [min, max] = cfg.chimeEvery
  chimeTimer = setTimeout(() => {
    if (ctx && nodes) {
      playChime(cfg.chimes[Math.floor(Math.random() * cfg.chimes.length)], cfg.chimeGain)
      scheduleChime(cfg)
    }
  }, min + Math.random() * (max - min))
}

export function startAmbient(sceneId) {
  stopAmbient()
  const cfg = CONFIG[sceneId] || CONFIG.sunset
  try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch { ctx = null; return }
  ctx.resume?.().catch(() => {})

  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  master.gain.linearRampToValueAtTime(1, ctx.currentTime + 2)
  nodes = { master, oscs: [] }

  // wind / water / rain bed
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, cfg.noise)
  src.loop = true
  const nf = ctx.createBiquadFilter()
  nf.type = cfg.kind === 'rain' ? 'bandpass' : 'lowpass'
  nf.frequency.value = cfg.filter
  nf.Q.value = cfg.q
  const ng = ctx.createGain()
  ng.gain.value = cfg.noiseGain
  src.connect(nf).connect(ng).connect(master)
  src.start()
  if (cfg.swell) {
    const lfo = ctx.createOscillator(); lfo.frequency.value = cfg.swell.rate
    const lg = ctx.createGain(); lg.gain.value = cfg.noiseGain * cfg.swell.depth
    lfo.connect(lg).connect(ng.gain); lfo.start()
    nodes.oscs.push(lfo)
  }

  if (cfg.kind === 'music') {
    const padFilter = ctx.createBiquadFilter()
    padFilter.type = 'lowpass'; padFilter.frequency.value = 1400
    const padGain = ctx.createGain(); padGain.gain.value = cfg.padGain
    padFilter.connect(padGain).connect(master)
    // slow tremolo so the chord gently breathes
    const trem = ctx.createOscillator(); trem.frequency.value = 0.07
    const tremGain = ctx.createGain(); tremGain.gain.value = cfg.padGain * 0.5
    trem.connect(tremGain).connect(padGain.gain); trem.start()
    nodes.oscs.push(trem)
    // the chord itself, each note doubled and slightly detuned for warmth
    cfg.pad.forEach((f) => {
      [-4, 4].forEach((cents) => {
        const o = ctx.createOscillator()
        o.type = 'sine'; o.frequency.value = f; o.detune.value = cents
        o.connect(padFilter); o.start()
        nodes.oscs.push(o)
      })
    })
    scheduleChime(cfg)
  }
}

export function stopAmbient() {
  if (chimeTimer) { clearTimeout(chimeTimer); chimeTimer = null }
  const c = ctx, n = nodes
  ctx = null
  nodes = null
  if (c && n) {
    try {
      const g = n.master.gain
      g.cancelScheduledValues(c.currentTime)
      g.setValueAtTime(g.value, c.currentTime)
      g.linearRampToValueAtTime(0, c.currentTime + 0.5)
    } catch { /* ignore */ }
    setTimeout(() => { try { c.close() } catch { /* ignore */ } }, 700)
  } else if (c) {
    try { c.close() } catch { /* ignore */ }
  }
}
