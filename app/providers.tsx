'use client'
import { useState, useEffect, createContext, useContext } from 'react'

type Theme = 'light' | 'dark'
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })
export const useTheme = () => useContext(ThemeCtx)

const ToastCtx = createContext<{ addToast: (msg: string) => void }>({ addToast: () => {} })
export const useToast = () => useContext(ToastCtx)

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [toasts, setToasts] = useState<{id:string;message:string}[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('cp-theme') as Theme
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('cp-theme', next)
  }

  const addToast = (message: string) => {
    const id = Date.now().toString()
    setToasts(p => [...p, { id, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200)
  }

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <ToastCtx.Provider value={{ addToast }}>
        {children}
        <div className="toast-container">
          {toasts.map(t => <div key={t.id} className="toast">{t.message}</div>)}
        </div>
      </ToastCtx.Provider>
    </ThemeCtx.Provider>
  )
}
