import { useState } from 'react'
import type { AppState, Priority, RepeatRule } from '../types'
import { addRepeat, removeRepeat, toggleRepeat } from '../lib/store'
import { WEEKDAYS_SHORT, formatLong, todayKey } from '../lib/date'
import { describeRule, nextOccurrence } from '../lib/repeats'
import { IconClock, IconPlus, IconRepeat, IconTrash } from './Icons'

type Mode = 'daily' | 'weekly' | 'interval' | 'monthly'

interface Props {
  state: AppState
  onToast: (msg: string) => void
}

export function RepeatsView({ state, onToast }: Props) {
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<Mode>('weekly')
  const [days, setDays] = useState<number[]>([0, 2, 4])
  const [every, setEvery] = useState(2)
  const [monthDay, setMonthDay] = useState(1)
  const [remindAt, setRemindAt] = useState('')
  const [priority, setPriority] = useState<Priority>(0)
  const [goalId, setGoalId] = useState('')

  const goals = state.goals.filter((g) => !g.archived)
  const today = todayKey()

  function buildRule(): RepeatRule {
    switch (mode) {
      case 'daily': return { type: 'daily' }
      case 'weekly': return { type: 'weekly', days: [...days].sort((a, b) => a - b) }
      case 'interval': return { type: 'interval', every: Math.max(1, every) }
      case 'monthly': return { type: 'monthly', day: Math.min(31, Math.max(1, monthDay)) }
    }
  }

  function submit() {
    if (!title.trim()) return
    if (mode === 'weekly' && days.length === 0) {
      onToast('Выбери хотя бы один день недели')
      return
    }
    addRepeat({
      title,
      rule: buildRule(),
      priority,
      goalId: goalId || null,
      remindAt: remindAt || null,
      startDate: today,
    })
    setTitle('')
    setRemindAt('')
    setPriority(0)
    onToast('Повтор добавлен')
  }

  return (
    <>
      <header className="panel topbar">
        <div className="day-title">
          <h1>Повторы</h1>
          <span className="weekday">задачи, которые ставятся сами</span>
        </div>
      </header>

      <div className="panel content">
        <div className="form">
          <input
            className="field"
            value={title}
            placeholder="Например: зал"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />

          <div className="pills">
            {([
              ['daily', 'каждый день'],
              ['weekly', 'дни недели'],
              ['interval', 'через N дней'],
              ['monthly', 'раз в месяц'],
            ] as Array<[Mode, string]>).map(([id, label]) => (
              <button
                key={id}
                className={`pill${mode === id ? ' active' : ''}`}
                onClick={() => setMode(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'weekly' && (
            <div className="pills">
              {WEEKDAYS_SHORT.map((w, i) => (
                <button
                  key={w}
                  className={`pill round${days.includes(i) ? ' active' : ''}`}
                  onClick={() =>
                    setDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]))
                  }
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {mode === 'interval' && (
            <div className="form-row">
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>каждые</span>
              <input
                className="field narrow"
                type="number"
                min={1}
                max={365}
                value={every}
                onChange={(e) => setEvery(Number(e.target.value))}
              />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>дн., начиная с сегодня</span>
            </div>
          )}

          {mode === 'monthly' && (
            <div className="form-row">
              <input
                className="field narrow"
                type="number"
                min={1}
                max={31}
                value={monthDay}
                onChange={(e) => setMonthDay(Number(e.target.value))}
              />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>числа каждого месяца</span>
            </div>
          )}

          <div className="form-row">
            <span style={{ color: 'var(--muted-2)', fontSize: 12.5 }}>напомнить в</span>
            <input
              className="field narrow"
              type="time"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              title="Напоминание"
            />
            <button
              className="pill"
              onClick={() => setPriority(((priority + 1) % 3) as Priority)}
            >
              <i className={`flag p${priority}`} style={{ marginRight: 6 }} />
              {['обычная', 'важная', 'срочная'][priority]}
            </button>
            {goals.length > 0 && (
              <select className="select" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
                <option value="">без цели</option>
                {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            )}
          </div>

          <button className="btn primary wide" onClick={submit}>
            <IconPlus /> Добавить повтор
          </button>
        </div>

        {state.repeats.length === 0 ? (
          <div className="empty">
            <IconRepeat size={26} />
            <div className="big">Повторов пока нет</div>
            <div>Задача из повтора появляется в нужный день сама</div>
          </div>
        ) : (
          <div className="cards">
            {state.repeats.map((repeat) => {
              const next = repeat.active ? nextOccurrence(repeat, today) : null
              const goal = state.goals.find((g) => g.id === repeat.goalId)
              return (
                <div key={repeat.id} className={`card${repeat.active ? '' : ' off'}`}>
                  <div className="card-head">
                    <i className={`flag p${repeat.priority}`} style={{ marginTop: 7 }} />
                    <div className="card-name">{repeat.title}</div>
                    <button
                      className="mini-btn danger"
                      onClick={() => removeRepeat(repeat.id)}
                      title="Удалить повтор"
                    >
                      <IconTrash />
                    </button>
                  </div>

                  <div className="task-meta">
                    <span><IconRepeat size={12} /> {describeRule(repeat.rule)}</span>
                    {repeat.remindAt && (
                      <span className="time"><IconClock size={12} /> {repeat.remindAt}</span>
                    )}
                    {goal && (
                      <span className="goal-tag" style={{ color: goal.color }}>
                        <i className="bullet" style={{ background: goal.color }} />
                        {goal.title}
                      </span>
                    )}
                    {next && <span>ближайший: {next === today ? 'сегодня' : formatLong(next)}</span>}
                  </div>

                  <button
                    className="btn"
                    onClick={() => toggleRepeat(repeat.id)}
                  >
                    {repeat.active ? 'Приостановить' : 'Включить'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
