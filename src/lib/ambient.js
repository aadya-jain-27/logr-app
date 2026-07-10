// Procedural scene ambience with the Web Audio API. No audio files: rain, waves,
// wind, and soft birdsong are synthesised, so it works offline and ships tiny.

let ctx = null
let nodes = null
let chirpTimer = null

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

// Tuned to sit calmly in the background, never intrusive.
// rain = bright bandpassed noise, waves/wind = low brown noise with a slow swell, birds = soft chirps.
const CONFIG = {
  rainy: { noise: 'white', type: 'bandpass', freq: 2200, q: 0.7, gain: 0.10, swell: null, chirp: false },
  ocean: { noise: 'brown', type: 'lowpass', freq: 480, q: 0.6, gain: 0.20, swell: { rate: 0.09, depth: 0.7 }, chirp: false },
  lakeside: { noise: 'brown', type: 'lowpass', freq: 700, q: 0.6, gain: 0.11, swell: { rate: 0.13, depth: 0.4 }, chirp: true },
  sunset: { noise: 'brown', type: 'lowpass', freq: 820, q: 0.5, gain: 0.08, swell: { rate: 0.05, depth: 0.3 }, chirp: true },
  winter: { noise: 'brown', type: 'lowpass', freq: 560, q: 0.4, gain: 0.11, swell: { rate: 0.06, depth: 0.45 }, chirp: false },
  lavender: { noise: 'brown', type: 'lowpass', freq: 760, q: 0.5, gain: 0.08, swell: { rate: 0.1, depth: 0.3 }, chirp: true },
}

function playChirp() {
  if (!ctx) return
  const now = ctx.currentTime
  const base = 1700 + Math.random() * 1400
  const notes = Math.random() < 0.5 ? 2 : 3
  for (let n = 0; n < notes; n++) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    const t = now + n * 0.12
    const f = base * (1 + n * 0.06)
    o.frequency.setValueAtTime(f, t)
    o.frequency.linearRampToValueAtTime(f * 1.12, t + 0.06)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.035, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.22)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + 0.24)
  }
}

function scheduleChirp() {
  chirpTimer = setTimeout(() => {
    if (ctx && nodes) { playChirp(); scheduleChirp() }
  }, 5000 + Math.random() * 9000)
}

export function startAmbient(sceneId) {
  stopAmbient()
  const cfg = CONFIG[sceneId] || CONFIG.sunset
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  } catch { ctx = null; return }
  ctx.resume?.().catch(() => {})

  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, cfg.noise)
  src.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = cfg.type
  filter.frequency.value = cfg.freq
  filter.Q.value = cfg.q
  const gain = ctx.createGain()
  gain.gain.value = 0
  src.connect(filter).connect(gain).connect(ctx.destination)
  src.start()
  gain.gain.linearRampToValueAtTime(cfg.gain, ctx.currentTime + 2)

  if (cfg.swell) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = cfg.swell.rate
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = cfg.gain * cfg.swell.depth
    lfo.connect(lfoGain).connect(gain.gain)
    lfo.start()
  }
  nodes = { src, gain }
  if (cfg.chirp) scheduleChirp()
}

export function stopAmbient() {
  if (chirpTimer) { clearTimeout(chirpTimer); chirpTimer = null }
  const closingCtx = ctx
  const closingNodes = nodes
  ctx = null
  nodes = null
  if (closingCtx && closingNodes) {
    try {
      const g = closingNodes.gain.gain
      g.cancelScheduledValues(closingCtx.currentTime)
      g.setValueAtTime(g.value, closingCtx.currentTime)
      g.linearRampToValueAtTime(0, closingCtx.currentTime + 0.5)
    } catch { /* ignore */ }
    setTimeout(() => { try { closingCtx.close() } catch { /* ignore */ } }, 700)
  } else if (closingCtx) {
    try { closingCtx.close() } catch { /* ignore */ }
  }
}
