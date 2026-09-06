import { memo, useEffect, useRef, useState } from 'react'
import type { Goal, Task } from '../types'
import { cyclePriority, removeTask, toggleTask, updateTask } from '../lib/store'
import { IconCheck, IconGrip, IconTrash, IconArrowRight } from './Icons'

const PRIORITY_LABEL = ['обычная', 'важная', 'срочная']

interface Props {
  task: Task
  goal: Goal | undefined
  dragOver: boolean
  onDragStart: (id: string) => void
  onDragOver: (id: string) => void
  onDrop: () => void
  onPostpone: (id: string) => void
}

function TaskItemInner({ task, goal, dragOver, onDragStart, onDragOver, onDrop, onPostpone }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commit() {
    const value = draft.trim()
    if (value && value !== task.title) updateTask(task.id, { title: value })
    else setDraft(task.title)
    setEditing(false)
  }

  return (
    <div
      className={`task${task.done ? ' done' : ''}${dragOver ? ' drag-over' : ''}`}
      draggable={!editing}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(task.id)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(task.id)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
    >
      <button
        className={`check${task.done ? ' checked' : ''}`}
        onClick={() => toggleTask(task.id)}
        aria-label={task.done ? 'Снять отметку' : 'Отметить выполненной'}
      >
        <IconCheck />
      </button>

      <div className="task-body">
        {editing ? (
          <input
            ref={inputRef}
            className="task-edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(task.title)
                setEditing(false)
              }
            }}
          />
        ) : (
          <div className="task-title" onDoubleClick={() => setEditing(true)}>
            {task.title}
          </div>
        )}

        {(task.priority > 0 || goal) && (
          <div className="task-meta">
            {task.priority > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <i className={`flag p${task.priority}`} />
                {PRIORITY_LABEL[task.priority]}
              </span>
            )}
            {goal && (
              <span className="goal-tag" style={{ color: goal.color }}>
                <i className="bullet" style={{ background: goal.color }} />
                {goal.title}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="task-actions">
        <button
          className="mini-btn"
          onClick={() => cyclePriority(task.id)}
          title={`Приоритет: ${PRIORITY_LABEL[task.priority]}`}
        >
          <i className={`flag p${task.priority}`} />
        </button>
        <button className="mini-btn" onClick={() => onPostpone(task.id)} title="Перенести на завтра">
          <IconArrowRight />
        </button>
        <button className="mini-btn danger" onClick={() => removeTask(task.id)} title="Удалить">
          <IconTrash />
        </button>
        <span className="mini-btn drag-handle desktop-only" title="Перетащить">
          <IconGrip />
        </span>
      </div>
    </div>
  )
}

export const TaskItem = memo(TaskItemInner)
