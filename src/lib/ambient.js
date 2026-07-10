// Procedural scene ambience with the Web Audio API. No audio files.
// Each world has its own character: different waveform, register, bed texture, and a
// signature element (rain + temple bell, fireplace crackle, water + birds, waves + gulls,
// airy music box with echo), so they sound clearly distinct from one another.

let ctx = null
let nodes = null
let vol = 0.7

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

// chime timbres: waveform, harmonic partials [multiplier, amplitude], and decay seconds.
const CHIME = {
  bell: { wave: 'sine', partials: [[1, 1], [2, 0.4], [3, 0.15]], decay: 2.6 },
  pluck: { wave: 'triangle', partials: [[1, 1], [2, 0.25]], decay: 0.9 },
  box: { wave: 'triangle', partials: [[1, 1], [3, 0.3], [4, 0.12]], decay: 1.7 },
  deep: { wave: 'sine', partials: [[1, 1], [1.5, 0.3]], decay: 3.6 },
}

const CONFIG = {
  rainy: { bedType: 'bandpass', noise: 'white', filter: 2200, q: 0.7, noiseGain: 0.11, temple: true },
  winter: { bedType: 'lowpass', noise: 'brown', filter: 420, q: 0.4, noiseGain: 0.05, swell: { rate: 0.05, depth: 0.4 },
    pad: [130.81, 196.00, 261.63], padType: 'sine', padGain: 0.05, chimes: [196.00, 261.63, 392.00], chimeType: 'bell', chimeGain: 0.08, chimeEvery: [9000, 16000], crackle: true },
  lakeside: { bedType: 'lowpass', noise: 'brown', filter: 950, q: 0.6, noiseGain: 0.06, swell: { rate: 0.15, depth: 0.45 },
    pad: [329.63, 392.00, 493.88], padType: 'triangle', padGain: 0.03, chimes: [659.25, 783.99, 880.00, 987.77], chimeType: 'pluck', chimeGain: 0.06, chimeEvery: [5000, 10000], birds: true },
  sunset: { bedType: 'lowpass', noise: 'brown', filter: 780, q: 0.5, noiseGain: 0.05, swell: { rate: 0.05, depth: 0.3 },
    pad: [220.00, 277.18, 329.63], padType: 'sine', padGain: 0.05, chimes: [440.00, 554.37, 659.25], chimeType: 'bell', chimeGain: 0.07, chimeEvery: [7000, 13000], birds: true },
  lavender: { bedType: 'highpass', noise: 'brown', filter: 900, q: 0.3, noiseGain: 0.035,
    pad: [293.66, 440.00, 587.33], padType: 'triangle', padGain: 0.028, chimes: [880.00, 987.77, 1174.66, 1318.51], chimeType: 'box', chimeGain: 0.05, chimeEvery: [4500, 10000], echo: true },
  ocean: { bedType: 'lowpass', noise: 'brown', filter: 420, q: 0.6, noiseGain: 0.15, swell: { rate: 0.07, depth: 0.85 },
    pad: [82.41, 123.47, 164.81], padType: 'sine', padGain: 0.06, chimes: [164.81, 246.94, 329.63], chimeType: 'deep', chimeGain: 0.09, chimeEvery: [11000, 20000], gull: true },
}

function scheduleRepeat(fn, min, max) {
  const run = () => {
    if (!ctx || !nodes) return
    try { fn() } catch { /* ignore */ }
    nodes.timers.push(setTimeout(run, min + Math.random() * (max - min)))
  }
  nodes.timers.push(setTimeout(run, min + Math.random() * (max - min)))
}

function playChime(freq, gainAmt, type) {
  const spec = CHIME[type] || CHIME.bell
  const now = ctx.currentTime
  spec.partials.forEach(([mult, amp]) => {
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.type = spec.wave; o.frequency.value = freq * mult
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(gainAmt * amp, now + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0005, now + spec.decay)
    o.connect(g).connect(nodes.chimeBus)
    o.start(now); o.stop(now + spec.decay + 0.1)
  })
}

function bird() {
  const now = ctx.currentTime
  const base = 1900 + Math.random() * 1300
  const notes = 2 + Math.floor(Math.random() * 2)
  for (let n = 0; n < notes; n++) {
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.type = 'sine'; const t = now + n * 0.11; const f = base * (1 + n * 0.05)
    o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.1, t + 0.05)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0006, t + 0.2)
    o.connect(g).connect(nodes.master); o.start(t); o.stop(t + 0.22)
  }
}

function gull() {
  const now = ctx.currentTime
  const o = ctx.createOscillator(); const g = ctx.createGain(); const lp = ctx.createBiquadFilter()
  o.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = 1600
  o.frequency.setValueAtTime(900, now); o.frequency.linearRampToValueAtTime(640, now + 0.3); o.frequency.linearRampToValueAtTime(520, now + 0.6)
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.028, now + 0.05); g.gain.exponentialRampToValueAtTime(0.0006, now + 0.7)
  o.connect(lp).connect(g).connect(nodes.master); o.start(now); o.stop(now + 0.75)
}

function temple() {
  const now = ctx.currentTime; const freq = 98
  ;[[1, 1], [2, 0.5], [2.76, 0.3], [5.4, 0.1]].forEach(([mult, amp]) => {
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.type = 'sine'; o.frequency.value = freq * mult
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06 * amp, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0004, now + 5)
    o.connect(g).connect(nodes.master); o.start(now); o.stop(now + 5.2)
  })
}

function crackle() {
  const now = ctx.currentTime
  const pops = 1 + Math.floor(Math.random() * 3)
  for (let i = 0; i < pops; i++) {
    const t = now + Math.random() * 0.3
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, 'white')
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1000 + Math.random() * 2500; bp.Q.value = 3
    const g = ctx.createGain(); const dur = 0.015 + Math.random() * 0.05
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0004, t + dur)
    src.connect(bp).connect(g).connect(nodes.master); src.start(t); src.stop(t + dur + 0.02)
  }
}

export function setVolume(v) {
  vol = Math.max(0, Math.min(1, v))
  if (ctx && nodes) { try { nodes.master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.1) } catch { /* ignore */ } }
}

export function startAmbient(sceneId, volume = vol) {
  stopAmbient()
  vol = Math.max(0, Math.min(1, volume))
  const cfg = CONFIG[sceneId] || CONFIG.sunset
  try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch { ctx = null; return }
  ctx.resume?.().catch(() => {})

  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2)
  nodes = { master, timers: [] }

  // chime bus, with an optional echo for the dreamy worlds
  const chimeBus = ctx.createGain(); chimeBus.gain.value = 1; chimeBus.connect(master)
  if (cfg.echo) {
    const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.3
    const fb = ctx.createGain(); fb.gain.value = 0.38
    const wet = ctx.createGain(); wet.gain.value = 0.8
    chimeBus.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master)
  }
  nodes.chimeBus = chimeBus

  // bed: rain / wind / water / airy breeze
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, cfg.noise); src.loop = true
  const nf = ctx.createBiquadFilter(); nf.type = cfg.bedType; nf.frequency.value = cfg.filter; nf.Q.value = cfg.q
  const ng = ctx.createGain(); ng.gain.value = cfg.noiseGain
  src.connect(nf).connect(ng).connect(master); src.start()
  if (cfg.swell) {
    const lfo = ctx.createOscillator(); lfo.frequency.value = cfg.swell.rate
    const lg = ctx.createGain(); lg.gain.value = cfg.noiseGain * cfg.swell.depth
    lfo.connect(lg).connect(ng.gain); lfo.start()
  }

  // chord pad that gently hums and breathes
  if (cfg.pad) {
    const pf = ctx.createBiquadFilter(); pf.type = 'lowpass'; pf.frequency.value = cfg.padType === 'triangle' ? 1100 : 1500
    const pg = ctx.createGain(); pg.gain.value = cfg.padGain; pf.connect(pg).connect(master)
    const trem = ctx.createOscillator(); trem.frequency.value = 0.07
    const tg = ctx.createGain(); tg.gain.value = cfg.padGain * 0.5
    trem.connect(tg).connect(pg.gain); trem.start()
    cfg.pad.forEach((f) => {
      [-4, 4].forEach((cents) => {
        const o = ctx.createOscillator(); o.type = cfg.padType; o.frequency.value = f; o.detune.value = cents
        o.connect(pf); o.start()
      })
    })
  }

  // chimes here and there
  if (cfg.chimes) scheduleRepeat(() => playChime(cfg.chimes[Math.floor(Math.random() * cfg.chimes.length)], cfg.chimeGain, cfg.chimeType), cfg.chimeEvery[0], cfg.chimeEvery[1])
  // signature elements
  if (cfg.crackle) scheduleRepeat(crackle, 140, 750)
  if (cfg.birds) scheduleRepeat(bird, 5000, 12000)
  if (cfg.gull) scheduleRepeat(gull, 12000, 24000)
  if (cfg.temple) scheduleRepeat(temple, 22000, 42000)
}

export function stopAmbient() {
  const c = ctx, n = nodes
  ctx = null
  nodes = null
  if (n) n.timers.forEach((id) => clearTimeout(id))
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
