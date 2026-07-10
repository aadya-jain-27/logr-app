import { createContext, useContext, useState } from 'react'

// Default off, and not persisted: browsers only allow audio to start from a user
// gesture, so the student turns it on with the speaker button when they want it.
const SoundCtx = createContext({ soundOn: false, toggleSound: () => {} })
export const useSound = () => useContext(SoundCtx)

export function SoundProvider({ children }) {
  const [soundOn, setSoundOn] = useState(false)
  const toggleSound = () => setSoundOn((v) => !v)
  return <SoundCtx.Provider value={{ soundOn, toggleSound }}>{children}</SoundCtx.Provider>
}
