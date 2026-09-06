import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppState } from '../types'
import { formatFull, relativeLabel } from '../lib/date'
import { IconSearch } from './Icons'

interface Props {
  state: AppState
  onPick: (day: string) => void
  onClose: () => void
}

export function SearchPalette({ state, onPick, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return state.tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : a.order - b.order))
      .slice(0, 40)
  }, [query, state.tasks])

  useEffect(() => setCursor(0), [query])

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="search-box" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          placeholder="Поиск по всем задачам…"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setCursor((c) => Math.min(c + 1, results.length - 1))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setCursor((c) => Math.max(c - 1, 0))
            }
            if (e.key === 'Enter' && results[cursor]) {
              onPick(results[cursor].day)
              onClose()
            }
          }}
        />
        <div className="search-results">
          {query.trim() && results.length === 0 && (
            <div className="empty"><div>Ничего не нашлось</div></div>
          )}
          {!query.trim() && (
            <div className="empty">
              <IconSearch size={22} />
              <div>Начни печатать — найду задачу в любом дне</div>
            </div>
          )}
          {results.map((task, i) => (
            <button
              key={task.id}
              className={`search-item${i === cursor ? ' active' : ''}`}
              onMouseEnter={() => setCursor(i)}
              onClick={() => {
                onPick(task.day)
                onClose()
              }}
            >
              <i className={`flag p${task.priority}`} />
              <span
                style={{
                  textDecoration: task.done ? 'line-through' : 'none',
                  opacity: task.done ? 0.55 : 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {task.title}
              </span>
              <span className="when">{relativeLabel(task.day) ?? formatFull(task.day)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
