import { useMemo, useState } from 'react'
import type { AppState } from '../types'
import { ACCENTS, addGoal, goalProgress, removeGoal, updateGoal } from '../lib/store'
import { IconPlus, IconTarget, IconTrash } from './Icons'

interface Props {
  state: AppState
}

export function GoalsView({ state }: Props) {
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState(10)
  const [color, setColor] = useState(ACCENTS[0])

  const goals = useMemo(
    () => [...state.goals].sort((a, b) => Number(a.archived) - Number(b.archived) || b.createdAt - a.createdAt),
    [state.goals],
  )

  function submit() {
    if (!title.trim()) return
    addGoal(title, color, target)
    setTitle('')
    setTarget(10)
  }

  return (
    <>
      <header className="panel topbar">
        <div className="day-title">
          <h1>Цели</h1>
          <span className="weekday">к чему идём</span>
        </div>
      </header>

      <div className="panel content">
        <div className="goal-form">
          <input
            type="text"
            value={title}
            placeholder="Например: прочитать 12 книг"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <input
            type="number"
            min={0}
            value={target}
            title="Сколько задач нужно закрыть (0 — без счётчика)"
            onChange={(e) => setTarget(Number(e.target.value))}
          />
          <div className="accents">
            {ACCENTS.map((c) => (
              <button
                key={c}
                className={`accent-dot${color === c ? ' active' : ''}`}
                style={{ background: c, color: c }}
                onClick={() => setColor(c)}
                aria-label={`Цвет ${c}`}
              />
            ))}
          </div>
          <button className="btn primary" onClick={submit}><IconPlus /> Добавить цель</button>
        </div>

        {goals.length === 0 ? (
          <div className="empty">
            <IconTarget size={26} />
            <div className="big">Целей пока нет</div>
            <div>Цель собирает связанные задачи и показывает прогресс</div>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map((goal) => {
              const progress = goalProgress(state, goal.id)
              const target = goal.target || progress.total
              const ratio = target ? Math.min(1, progress.done / target) : 0
              return (
                <div key={goal.id} className={`goal-card${goal.archived ? ' archived' : ''}`}>
                  <div className="goal-head">
                    <i
                      className="bullet"
                      style={{ background: goal.color, width: 10, height: 10, borderRadius: 99, marginTop: 6 }}
                    />
                    <div className="goal-name">{goal.title}</div>
                    <button
                      className="mini-btn danger"
                      onClick={() => removeGoal(goal.id)}
                      title="Удалить цель"
                    >
                      <IconTrash />
                    </button>
                  </div>

                  <div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${ratio * 100}%`, background: goal.color }}
                      />
                    </div>
                    <div className="task-meta" style={{ marginTop: 7 }}>
                      <span>
                        {progress.done} из {goal.target || progress.total || 0}
                        {goal.target ? '' : ' задач'}
                      </span>
                      <span>·</span>
                      <span>{Math.round(ratio * 100)}%</span>
                      {progress.total - progress.done > 0 && (
                        <>
                          <span>·</span>
                          <span>в работе {progress.total - progress.done}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn ghost"
                      onClick={() => updateGoal(goal.id, { archived: !goal.archived })}
                    >
                      {goal.archived ? 'Вернуть' : 'В архив'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
