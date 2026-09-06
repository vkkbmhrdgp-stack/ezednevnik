import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppState, Priority } from '../types'
import {
  addTask, clearDone, dayStats, moveUndone, reorderTask, setNote, tasksOfDay, updateTask,
} from '../lib/store'
import { WEEKDAYS_FULL, addDays, formatLong, fromKey, relativeLabel, todayKey, weekdayIndex } from '../lib/date'
import { TaskItem } from './TaskItem'
import { WeekStrip } from './WeekStrip'
import {
  IconBroom, IconChevronLeft, IconChevronRight, IconNote, IconPlus, IconSearch,
} from './Icons'

interface Props {
  state: AppState
  day: string
  onDay: (d: string) => void
  onSearch: () => void
  onToast: (msg: string) => void
}

const PRIORITY_LABEL = ['обычная', 'важная', 'срочная']

export function DayView({ state, day, onDay, onSearch, onToast }: Props) {
  const [draft, setDraft] = useState('')
  const [priority, setPriority] = useState<Priority>(0)
  const [goalId, setGoalId] = useState<string>('')
  const [showNote, setShowNote] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)

  const tasks = useMemo(() => tasksOfDay(state, day), [state.tasks, day])
  const stats = dayStats(state, day)
  const note = state.notes[day] ?? ''
  const goals = state.goals.filter((g) => !g.archived)
  const goalById = useMemo(() => new Map(state.goals.map((g) => [g.id, g])), [state.goals])
  const relative = relativeLabel(day)
  const undone = tasks.filter((t) => t.done === false).length

  useEffect(() => {
    if (note) setShowNote(true)
  }, [day]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA'].includes(target.tagName)
      if (e.key === 'Enter' && !typing && !e.metaKey && !e.ctrlKey && window.innerWidth > 900) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function submit() {
    if (!draft.trim()) return
    addTask(day, draft, priority, goalId || null)
    setDraft('')
    setPriority(0)
  }

  const active = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const circumference = 2 * Math.PI * 18

  return (
    <>
      <header className="panel topbar">
        <button className="icon-btn" onClick={() => onDay(addDays(day, -1))} aria-label="Предыдущий день">
          <IconChevronLeft />
        </button>
        <button className="icon-btn" onClick={() => onDay(addDays(day, 1))} aria-label="Следующий день">
          <IconChevronRight />
        </button>

        <div className="day-title">
          <h1>{formatLong(day)}<span className="desktop-only"> {fromKey(day).getFullYear()}</span></h1>
          <span className="weekday desktop-only">{WEEKDAYS_FULL[weekdayIndex(day)]}</span>
          {relative && relative !== 'сегодня' && <span className="chip">{relative}</span>}
          {relative === 'сегодня' && <span className="chip desktop-only">сегодня</span>}
        </div>

        <div className="spacer" />

        <div className="progress-wrap">
          <div className={`ring${stats.total > 0 && stats.ratio === 1 ? ' full' : ''}`}>
            <svg width="42" height="42">
              <circle className="track" cx="21" cy="21" r="18" />
              <circle
                className="bar"
                cx="21"
                cy="21"
                r="18"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - stats.ratio)}
              />
            </svg>
            <div className="label">{Math.round(stats.ratio * 100)}</div>
          </div>
        </div>

        {day !== todayKey() && (
          <button className="btn" onClick={() => onDay(todayKey())}>Сегодня</button>
        )}
        <button className="icon-btn" onClick={onSearch} aria-label="Поиск">
          <IconSearch />
        </button>
      </header>

      <WeekStrip state={state} day={day} onDay={onDay} />

      <div className="composer">
        <input
          ref={inputRef}
          value={draft}
          placeholder="Что нужно сделать?"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') (e.target as HTMLInputElement).blur()
          }}
        />
        {goals.length > 0 && (
          <select
            className="select desktop-only"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
          >
            <option value="">без цели</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        )}
        <button
          className="prio-pick"
          onClick={() => setPriority(((priority + 1) % 3) as Priority)}
          title="Приоритет новой задачи"
        >
          <i className={`flag p${priority}`} />
          <span className="desktop-only">{PRIORITY_LABEL[priority]}</span>
        </button>
        <button className="btn primary" onClick={submit}>
          <IconPlus /> <span className="desktop-only">Добавить</span>
        </button>
      </div>

      <div
        className="panel content"
        onTouchStart={(e) => {
          const t = e.touches[0]
          touch.current = { x: t.clientX, y: t.clientY }
        }}
        onTouchEnd={(e) => {
          const start = touch.current
          if (!start) return
          touch.current = null
          const t = e.changedTouches[0]
          const dx = t.clientX - start.x
          const dy = t.clientY - start.y
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.8) {
            onDay(addDays(day, dx < 0 ? 1 : -1))
          }
        }}
      >
        {tasks.length === 0 ? (
          <div className="empty">
            <div className="big">На этот день пока пусто</div>
            <div>Напиши задачу выше и нажми <kbd>Enter</kbd></div>
          </div>
        ) : (
          <>
            <div className="list">
              <div className="list-head">
                <span className="section-label">Задачи</span>
                <span className="count-badge">{active.length}</span>
                <div className="spacer" />
                {undone > 0 && (
                  <button
                    className="btn ghost"
                    onClick={() => {
                      const moved = moveUndone(day, addDays(day, 1))
                      if (moved) onToast(`Перенесено на завтра: ${moved}`)
                    }}
                  >
                    <span className="desktop-only">Перенести незакрытые</span>
                    <span className="mobile-only">На завтра</span>
                  </button>
                )}
                <button className="btn ghost" onClick={() => setShowNote((v) => !v)}>
                  <IconNote /> Заметка
                </button>
              </div>

              {active.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  goal={task.goalId ? goalById.get(task.goalId) : undefined}
                  dragOver={overId === task.id && dragId !== task.id}
                  onDragStart={setDragId}
                  onDragOver={setOverId}
                  onDrop={() => {
                    if (dragId && overId) reorderTask(dragId, overId)
                    setDragId(null)
                    setOverId(null)
                  }}
                  onPostpone={(id) => {
                    updateTask(id, { day: addDays(day, 1) })
                    onToast('Перенесено на завтра')
                  }}
                />
              ))}

              {active.length === 0 && (
                <div className="empty"><div className="big">Всё закрыто 🎉</div></div>
              )}
            </div>

            {done.length > 0 && (
              <div className="list">
                <div className="list-head">
                  <span className="section-label">Выполнено</span>
                  <span className="count-badge">{done.length}</span>
                  <div className="spacer" />
                  <button className="btn ghost danger" onClick={() => clearDone(day)}>
                    <IconBroom /> Очистить
                  </button>
                </div>
                {done.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    goal={task.goalId ? goalById.get(task.goalId) : undefined}
                    dragOver={false}
                    onDragStart={setDragId}
                    onDragOver={setOverId}
                    onDrop={() => {
                      setDragId(null)
                      setOverId(null)
                    }}
                    onPostpone={(id) => updateTask(id, { day: addDays(day, 1), done: false, doneAt: null })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {showNote && (
          <div className="note">
            <div className="list-head" style={{ marginBottom: 8 }}>
              <span className="section-label">Заметка дня</span>
            </div>
            <textarea
              value={note}
              placeholder="Мысли, итоги дня, что угодно…"
              onChange={(e) => setNote(day, e.target.value)}
            />
          </div>
        )}
      </div>
    </>
  )
}
