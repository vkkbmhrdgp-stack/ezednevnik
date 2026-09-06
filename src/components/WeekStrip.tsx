import { useMemo } from 'react'
import type { AppState } from '../types'
import { WEEKDAYS_SHORT, fromKey, todayKey, weekDays } from '../lib/date'

interface Props {
  state: AppState
  day: string
  onDay: (d: string) => void
}

export function WeekStrip({ state, day, onDay }: Props) {
  const days = useMemo(() => weekDays(day), [day])

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>()
    for (const t of state.tasks) {
      if (!days.includes(t.day)) continue
      const entry = map.get(t.day) ?? { total: 0, done: 0 }
      entry.total++
      if (t.done) entry.done++
      map.set(t.day, entry)
    }
    return map
  }, [state.tasks, days])

  const today = todayKey()

  return (
    <div className="week">
      {days.map((key, i) => {
        const stat = stats.get(key) ?? { total: 0, done: 0 }
        const ratio = stat.total ? stat.done / stat.total : 0
        const classes = ['week-day']
        if (key === day) classes.push('selected')
        if (key === today) classes.push('today')
        if (i >= 5) classes.push('weekend')
        return (
          <button key={key} className={classes.join(' ')} onClick={() => onDay(key)}>
            <span className="wd">{WEEKDAYS_SHORT[i]}</span>
            <span className="num">{fromKey(key).getDate()}</span>
            <span className="week-count">{stat.total ? `${stat.done}/${stat.total}` : '—'}</span>
            <span
              className={`week-bar${stat.total > 0 && ratio === 1 ? ' done' : ''}`}
              style={{ width: `${ratio * 100}%` }}
            />
          </button>
        )
      })}
    </div>
  )
}
