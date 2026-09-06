import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppState } from '../types'
import { ACCENTS, exportData, importData, setAccent, setRemindersOn, streak } from '../lib/store'
import { MONTHS_NOM, WEEKDAYS_SHORT, fromKey, monthGrid, todayKey } from '../lib/date'
import { permission, requestPermission } from '../lib/notify'
import { IconBell, IconDownload, IconFlame, IconUpload } from './Icons'

export function MonthCalendar({
  state, day, onDay,
}: { state: AppState; day: string; onDay: (d: string) => void }) {
  const [month, setMonth] = useState(() => fromKey(day))
  const dayMonth = day.slice(0, 7)

  // при переходе на день из другого месяца календарь листается сам
  useEffect(() => setMonth(fromKey(day)), [dayMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  const cells = useMemo(() => monthGrid(month.getFullYear(), month.getMonth()), [month])

  const index = useMemo(() => {
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

  return (
    <div className="sidebar-section" style={{ padding: 0, gap: 10, display: 'flex', flexDirection: 'column' }}>
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
        {WEEKDAYS_SHORT.map((w) => <div key={w} className="mini-cal-head">{w}</div>)}
        {cells.map((key) => {
          const d = fromKey(key)
          const stat = index.get(key)
          const classes = ['mini-day']
          if (d.getMonth() !== month.getMonth()) classes.push('other')
          if (key === today) classes.push('today')
          if (key === day) classes.push('selected')
          return (
            <button key={key} className={classes.join(' ')} onClick={() => onDay(key)}>
              {d.getDate()}
              {stat && stat.total > 0 && (
                <i className={`dot${stat.done === stat.total ? ' all-done' : ''}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function StatsCards({ state }: { state: AppState }) {
  const done = state.tasks.filter((t) => t.done).length
  return (
    <div className="stat-row">
      <div className="stat-card">
        <div className="stat-value">{done}</div>
        <div className="stat-label">закрыто всего</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">
          {streak(state)}
          <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><IconFlame size={16} /></span>
        </div>
        <div className="stat-label">дней подряд</div>
      </div>
    </div>
  )
}

export function AccentPicker({ state }: { state: AppState }) {
  return (
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
  )
}

export function BackupButtons({ onToast }: { onToast: (msg: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)

  function doExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ezednevnik-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
    onToast('Резервная копия сохранена')
  }

  return (
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
          if (file) {
            const reader = new FileReader()
            reader.onload = () => onToast(importData(String(reader.result)) ? 'Данные загружены' : 'Не получилось прочитать файл')
            reader.readAsText(file)
          }
          e.target.value = ''
        }}
      />
    </div>
  )
}

export function RemindersToggle({ state, onToast }: { state: AppState; onToast: (msg: string) => void }) {
  const [perm, setPerm] = useState(permission())
  const on = state.remindersOn && perm === 'granted'

  async function toggle() {
    if (on) {
      setRemindersOn(false)
      return
    }
    let current = permission()
    if (current === 'default') {
      current = await requestPermission()
      setPerm(current)
    }
    if (current === 'granted') {
      setRemindersOn(true)
      onToast('Напоминания включены')
    } else {
      onToast('Уведомления запрещены в настройках браузера')
    }
  }

  return (
    <div className="setting">
      <span style={{ color: on ? 'var(--accent)' : 'var(--muted-2)', display: 'inline-flex' }}>
        <IconBell size={18} />
      </span>
      <div className="txt">
        <div className="t">Напоминания</div>
        <div className="s">
          {perm === 'denied'
            ? 'браузер запретил уведомления'
            : 'приходят, пока приложение открыто или свёрнуто'}
        </div>
      </div>
      <button className={`switch${on ? ' on' : ''}`} onClick={toggle} aria-label="Включить напоминания" />
    </div>
  )
}
