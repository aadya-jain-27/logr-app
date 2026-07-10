import { createContext, useContext, useState } from 'react'

// Default off, and not persisted for the on/off state: browsers only allow audio to
// start from a user gesture, so the student turns it on with the speaker button.
// Volume is remembered.
const SoundCtx = createContext({ soundOn: false, toggleSound: () => {}, volume: 0.7, setVolume: () => {} })
export const useSound = () => useContext(SoundCtx)

export function SoundProvider({ children }) {
  const [soundOn, setSoundOn] = useState(false)
  const [volume, setVol] = useState(() => {
    const v = parseFloat(localStorage.getItem('logr-volume'))
    return Number.isFinite(v) ? v : 0.7
  })
  const toggleSound = () => setSoundOn((s) => !s)
  const setVolume = (v) => { setVol(v); localStorage.setItem('logr-volume', String(v)) }
  return <SoundCtx.Provider value={{ soundOn, toggleSound, volume, setVolume }}>{children}</SoundCtx.Provider>
}
