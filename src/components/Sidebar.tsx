import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppState } from '../types'
import { ACCENTS, exportData, importData, setAccent, streak } from '../lib/store'
import { MONTHS_NOM, WEEKDAYS_SHORT, fromKey, monthGrid, todayKey } from '../lib/date'
import { IconCalendar, IconDownload, IconFlame, IconLogo, IconTarget, IconUpload } from './Icons'

type View = 'day' | 'goals'

interface Props {
  state: AppState
  view: View
  onView: (v: View) => void
  day: string
  onDay: (d: string) => void
  onToast: (msg: string) => void
}

export function Sidebar({ state, view, onView, day, onDay, onToast }: Props) {
  const [month, setMonth] = useState(() => fromKey(day))
  const fileRef = useRef<HTMLInputElement>(null)
  const dayMonth = day.slice(0, 7)

  // при переходе на день из другого месяца календарь листается сам
  useEffect(() => setMonth(fromKey(day)), [dayMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  const cells = useMemo(
    () => monthGrid(month.getFullYear(), month.getMonth()),
    [month],
  )

  const dayIndex = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>()
    for (const t of state.tasks) {
      const entry = map.get(t.day) ?? { total: 0, done: 0 }
      entry.total++
      if (t.done) entry.done++
      map.set(t.day, entry)
    }
    return map
  }, [state.tasks])

  const today = todayKey()
  const totals = useMemo(() => {
    const done = state.tasks.filter((t) => t.done).length
    return { done, open: state.tasks.length - done }
  }, [state.tasks])
  const days = streak(state)
  const activeGoals = state.goals.filter((g) => !g.archived).length

  function doExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ezednevnik-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
    onToast('Резервная копия сохранена')
  }

  function doImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importData(String(reader.result))
      onToast(ok ? 'Данные загружены' : 'Не получилось прочитать файл')
    }
    reader.readAsText(file)
  }

  return (
    <aside className="panel sidebar">
      <div className="brand">
        <div className="brand-mark"><IconLogo /></div>
        <div>
          <div className="brand-name">Ежедневник</div>
          <div className="brand-sub">всё хранится у тебя</div>
        </div>
      </div>

      <nav className="nav">
        <button className={`nav-item${view === 'day' ? ' active' : ''}`} onClick={() => onView('day')}>
          <IconCalendar /> Дни
          <span className="badge">{totals.open}</span>
        </button>
        <button className={`nav-item${view === 'goals' ? ' active' : ''}`} onClick={() => onView('goals')}>
          <IconTarget /> Цели
          <span className="badge">{activeGoals}</span>
        </button>
      </nav>

      <div className="sidebar-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="section-label" style={{ flex: 1 }}>
            {MONTHS_NOM[month.getMonth()]} {month.getFullYear()}
          </span>
          <button
            className="mini-btn"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            aria-label="Предыдущий месяц"
          >‹</button>
          <button
            className="mini-btn"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            aria-label="Следующий месяц"
          >›</button>
        </div>

        <div className="mini-cal">
          {WEEKDAYS_SHORT.map((w) => (
            <div key={w} className="mini-cal-head">{w}</div>
          ))}
          {cells.map((key) => {
            const d = fromKey(key)
            const stat = dayIndex.get(key)
            const classes = ['mini-day']
            if (d.getMonth() !== month.getMonth()) classes.push('other')
            if (key === today) classes.push('today')
            if (key === day) classes.push('selected')
            return (
              <button
                key={key}
                className={classes.join(' ')}
                onClick={() => {
                  onDay(key)
                  onView('day')
                }}
              >
                {d.getDate()}
                {stat && stat.total > 0 && (
                  <i className={`dot${stat.done === stat.total ? ' all-done' : ''}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-value">{totals.done}</div>
            <div className="stat-label">закрыто всего</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {days}
              <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><IconFlame size={16} /></span>
            </div>
            <div className="stat-label">дней подряд</div>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="hotkeys">
          <div className="section-label" style={{ marginBottom: 2 }}>Быстрые клавиши</div>
          <div className="hotkeys-row">
            <span><kbd>←</kbd> <kbd>→</kbd> дни</span>
            <span><kbd>T</kbd> сегодня</span>
          </div>
          <div className="hotkeys-row">
            <span><kbd>Enter</kbd> новая задача</span>
          </div>
          <div className="hotkeys-row">
            <span><kbd>G</kbd> цели</span>
            <span><kbd>/</kbd> поиск</span>
          </div>
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>Акцент</div>
          <div className="accents">
            {ACCENTS.map((c) => (
              <button
                key={c}
                className={`accent-dot${state.accent === c ? ' active' : ''}`}
                style={{ background: c, color: c }}
                onClick={() => setAccent(c)}
                aria-label={`Цвет ${c}`}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={doExport}>
            <IconDownload /> Бэкап
          </button>
          <button className="btn ghost" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
            <IconUpload /> Загрузить
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) doImport(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>
    </aside>
  )
}
