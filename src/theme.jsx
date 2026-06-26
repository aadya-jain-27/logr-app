import { createContext, useContext, useEffect, useState } from 'react'

const SceneCtx = createContext({ scene: 'sunset', setScene: () => {} })
export const useScene = () => useContext(SceneCtx)

export function SceneProvider({ children }) {
  const [scene, setScene] = useState(() => localStorage.getItem('logr-scene') || 'sunset')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', scene)
    localStorage.setItem('logr-scene', scene)
  }, [scene])
  return <SceneCtx.Provider value={{ scene, setScene }}>{children}</SceneCtx.Provider>
}
