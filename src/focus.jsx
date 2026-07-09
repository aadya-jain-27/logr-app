import { createContext, useContext, useState } from 'react'

const FocusCtx = createContext({ isOpen: false, taskLabel: null, open: () => {}, close: () => {} })
export const useFocus = () => useContext(FocusCtx)

export function FocusProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [taskLabel, setTaskLabel] = useState(null)
  const open = (label = null) => { setTaskLabel(label); setIsOpen(true) }
  const close = () => setIsOpen(false)
  return <FocusCtx.Provider value={{ isOpen, taskLabel, open, close }}>{children}</FocusCtx.Provider>
}
