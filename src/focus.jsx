import { createContext, useContext, useState } from 'react'

// A tiny context so any screen can open the floating focus timer.
const FocusCtx = createContext({ isOpen: false, open: () => {}, close: () => {} })
export const useFocus = () => useContext(FocusCtx)

export function FocusProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  return <FocusCtx.Provider value={{ isOpen, open, close }}>{children}</FocusCtx.Provider>
}
