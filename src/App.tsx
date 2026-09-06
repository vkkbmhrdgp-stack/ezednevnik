import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from './lib/store'
import { addDays, todayKey } from './lib/date'
import { Sidebar } from './components/Sidebar'
import { DayView } from './components/DayView'
import { GoalsView } from './components/GoalsView'
import { SearchPalette } from './components/SearchPalette'

type View = 'day' | 'goals'

export default function App() {
  const state = useStore()
  const [view, setView] = useState<View>('day')
  const [day, setDay] = useState(todayKey)
  const [searching, setSearching] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number>()

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', state.accent)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#08090d')
  }, [state.accent])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA'].includes(target.tagName)

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearching(true)
        return
      }
      if (typing) return

      if (e.key === 'ArrowLeft') setDay((d) => addDays(d, -1))
      if (e.key === 'ArrowRight') setDay((d) => addDays(d, 1))
      if (e.key.toLowerCase() === 't') setDay(todayKey())
      if (e.key.toLowerCase() === 'g') setView((v) => (v === 'goals' ? 'day' : 'goals'))
      if (e.key === '/') {
        e.preventDefault()
        setSearching(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pickDay = useCallback((d: string) => {
    setDay(d)
    setView('day')
  }, [])

  return (
    <div className="app">
      <Sidebar
        state={state}
        view={view}
        onView={setView}
        day={day}
        onDay={pickDay}
        onToast={showToast}
      />

      <main className="main">
        {view === 'day' ? (
          <DayView
            state={state}
            day={day}
            onDay={setDay}
            onSearch={() => setSearching(true)}
            onToast={showToast}
          />
        ) : (
          <GoalsView state={state} />
        )}
      </main>

      {searching && (
        <SearchPalette state={state} onPick={pickDay} onClose={() => setSearching(false)} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
