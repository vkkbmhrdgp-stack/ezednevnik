import type { View } from '../views'
import { IconCalendar, IconDots, IconRepeat, IconTarget } from './Icons'

interface Props {
  view: View
  onView: (v: View) => void
  openToday: number
}

export function TabBar({ view, onView, openToday }: Props) {
  const tabs: Array<{ id: View; label: string; icon: JSX.Element; dot?: number }> = [
    { id: 'day', label: 'Дни', icon: <IconCalendar size={19} />, dot: openToday },
    { id: 'goals', label: 'Цели', icon: <IconTarget size={19} /> },
    { id: 'repeats', label: 'Повторы', icon: <IconRepeat size={19} /> },
    { id: 'more', label: 'Ещё', icon: <IconDots size={19} /> },
  ]

  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab${view === tab.id ? ' active' : ''}`}
          onClick={() => onView(tab.id)}
        >
          {tab.icon}
          {tab.label}
          {tab.dot ? <span className="tab-dot">{tab.dot > 99 ? '99+' : tab.dot}</span> : null}
        </button>
      ))}
    </nav>
  )
}
