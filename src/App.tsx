import { useCallback, useEffect, useRef, useState } from 'react'
import { markNotified, materialize, useStore } from './lib/store'
import { addDays, todayKey } from './lib/date'
import { notify, permission, remindTime } from './lib/notify'
import type { View } from './views'
import { Sidebar } from './components/Sidebar'
import { TabBar } from './components/TabBar'
import { DayView } from './components/DayView'
import { GoalsView } from './components/GoalsView'
import { RepeatsView } from './components/RepeatsView'
import { MoreView } from './components/MoreView'
import { SearchPalette } from './components/SearchPalette'

const HORIZON_DAYS = 14 // на сколько дней вперёд заранее раскрываются повторы
const MISSED_WINDOW = 12 * 60 * 60 * 1000

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

export default function App() {
  const state = useStore()
  const isMobile = useIsMobile()
  const [view, setView] = useState<View>('day')
  const [day, setDay] = useState(todayKey)
  const [searching, setSearching] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number>()
  const timers = useRef<number[]>([])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', state.accent)
  }, [state.accent])

  // повторы разворачиваются в задачи на ближайшие дни и на открытый день
  useEffect(() => {
    const today = todayKey()
    const days = Array.from({ length: HORIZON_DAYS }, (_, i) => addDays(today, i))
    if (day >= today && !days.includes(day)) days.push(day)
    materialize(days)
  }, [state.repeats, state.repeatLog, day])

  // напоминания: таймеры на сегодня-завтра плюс догоняющие за пропущенные
  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (!state.remindersOn || permission() !== 'granted') return

    const now = Date.now()
    const missed: string[] = []

    for (const task of state.tasks) {
      if (task.done || task.notifiedAt || !task.remindAt) continue
      const at = remindTime(task.day, task.remindAt)
      if (at === null) continue

      if (at <= now) {
        if (now - at < MISSED_WINDOW) missed.push(task.id)
        continue
      }
      if (at - now > 36 * 60 * 60 * 1000) continue

      const id = window.setTimeout(() => {
        notify('Ежедневник', task.title, task.id)
        markNotified([task.id])
      }, at - now)
      timers.current.push(id)
    }

    if (missed.length) {
      const first = state.tasks.find((t) => t.id === missed[0])
      const title = missed.length === 1 ? 'Просроченное напоминание' : `Пропущено напоминаний: ${missed.length}`
      const body = first ? `${first.title}${missed.length > 1 ? ' и другие' : ''}` : ''
      notify(title, body, 'missed')
      markNotified(missed)
    }

    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [state.tasks, state.remindersOn])

  // возврат в приложение: раскрываем повторы на новый день (например, после полуночи)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      const today = todayKey()
      materialize(Array.from({ length: HORIZON_DAYS }, (_, i) => addDays(today, i)))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
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

  const openToday = state.tasks.filter((t) => !t.done && t.day <= todayKey()).length

  return (
    <div className="app">
      {!isMobile && (
        <Sidebar
          state={state}
          view={view}
          onView={setView}
          day={day}
          onDay={pickDay}
          onToast={showToast}
        />
      )}

      <main className="main">
        {view === 'day' && (
          <DayView
            state={state}
            day={day}
            onDay={setDay}
            onSearch={() => setSearching(true)}
            onToast={showToast}
          />
        )}
        {view === 'goals' && <GoalsView state={state} />}
        {view === 'repeats' && <RepeatsView state={state} onToast={showToast} />}
        {view === 'more' && (
          <MoreView state={state} day={day} onDay={pickDay} onToast={showToast} />
        )}
      </main>

      {isMobile && <TabBar view={view} onView={setView} openToday={openToday} />}

      {searching && (
        <SearchPalette state={state} onPick={pickDay} onClose={() => setSearching(false)} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
