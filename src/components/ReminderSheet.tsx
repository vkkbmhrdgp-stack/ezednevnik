import { useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  value: string | null
  onPick: (time: string | null) => void
  onClose: () => void
}

const PRESETS = ['07:00', '08:00', '09:00', '10:00', '12:00', '15:00', '18:00', '21:00']

export function ReminderSheet({ value, onPick, onClose }: Props) {
  const [custom, setCustom] = useState(value ?? '09:00')

  return createPortal(
    <div className="overlay" onMouseDown={onClose}>
      <div className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Напоминание</h3>

        <div className="time-grid">
          {PRESETS.map((t) => (
            <button
              key={t}
              className={`pill${value === t ? ' active' : ''}`}
              style={{ textAlign: 'center' }}
              onClick={() => {
                onPick(t)
                onClose()
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="form-row">
          <input
            className="field"
            type="time"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button
            className="btn primary"
            onClick={() => {
              onPick(custom || null)
              onClose()
            }}
          >
            Поставить
          </button>
        </div>

        <div className="form-row">
          {value && (
            <button
              className="btn danger wide"
              onClick={() => {
                onPick(null)
                onClose()
              }}
            >
              Убрать напоминание
            </button>
          )}
          <button className="btn ghost wide" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
