import type { AppState } from '../types'
import { AccentPicker, BackupButtons, MonthCalendar, RemindersToggle, StatsCards } from './Bits'

interface Props {
  state: AppState
  day: string
  onDay: (d: string) => void
  onToast: (msg: string) => void
}

export function MoreView({ state, day, onDay, onToast }: Props) {
  return (
    <>
      <header className="panel topbar">
        <div className="day-title">
          <h1>Ещё</h1>
          <span className="weekday">календарь и настройки</span>
        </div>
      </header>

      <div className="panel content">
        <MonthCalendar state={state} day={day} onDay={onDay} />
        <StatsCards state={state} />
        <RemindersToggle state={state} onToast={onToast} />

        <div>
          <div className="section-label" style={{ marginBottom: 10 }}>Цвет акцента</div>
          <AccentPicker state={state} />
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 10 }}>Данные</div>
          <BackupButtons onToast={onToast} />
          <div className="s" style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 8 }}>
            Всё хранится только на этом устройстве. Бэкап — чтобы перенести на другое.
          </div>
        </div>
      </div>
    </>
  )
}
