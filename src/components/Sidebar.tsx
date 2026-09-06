import type { AppState } from '../types'
import type { View } from '../views'
import { AccentPicker, BackupButtons, MonthCalendar, RemindersToggle, StatsCards } from './Bits'
import { IconCalendar, IconLogo, IconRepeat, IconTarget } from './Icons'

interface Props {
  state: AppState
  view: View
  onView: (v: View) => void
  day: string
  onDay: (d: string) => void
  onToast: (msg: string) => void
}

export function Sidebar({ state, view, onView, day, onDay, onToast }: Props) {
  const open = state.tasks.filter((t) => !t.done).length
  const activeGoals = state.goals.filter((g) => !g.archived).length
  const activeRepeats = state.repeats.filter((r) => r.active).length

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
          <IconCalendar /> Дни <span className="count-badge">{open}</span>
        </button>
        <button className={`nav-item${view === 'goals' ? ' active' : ''}`} onClick={() => onView('goals')}>
          <IconTarget /> Цели <span className="count-badge">{activeGoals}</span>
        </button>
        <button className={`nav-item${view === 'repeats' ? ' active' : ''}`} onClick={() => onView('repeats')}>
          <IconRepeat /> Повторы <span className="count-badge">{activeRepeats}</span>
        </button>
      </nav>

      <div className="sidebar-section">
        <MonthCalendar state={state} day={day} onDay={(d) => { onDay(d); onView('day') }} />
      </div>

      <div className="sidebar-section">
        <StatsCards state={state} />
      </div>

      <div className="sidebar-footer">
        <RemindersToggle state={state} onToast={onToast} />

        <div className="hotkeys">
          <div className="section-label" style={{ marginBottom: 2 }}>Быстрые клавиши</div>
          <div className="hotkeys-row">
            <span><kbd>←</kbd> <kbd>→</kbd> дни</span>
            <span><kbd>T</kbd> сегодня</span>
          </div>
          <div className="hotkeys-row"><span><kbd>Enter</kbd> новая задача</span></div>
          <div className="hotkeys-row">
            <span><kbd>G</kbd> цели</span>
            <span><kbd>/</kbd> поиск</span>
          </div>
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>Акцент</div>
          <AccentPicker state={state} />
        </div>

        <BackupButtons onToast={onToast} />
      </div>
    </aside>
  )
}
