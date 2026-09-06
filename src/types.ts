export type Priority = 0 | 1 | 2 // 0 — обычная, 1 — важная, 2 — срочная

export type RepeatRule =
  | { type: 'daily' }
  | { type: 'weekly'; days: number[] } // 0 — понедельник
  | { type: 'interval'; every: number } // каждые N дней от startDate
  | { type: 'monthly'; day: number } // число месяца, 1–31

export interface Task {
  id: string
  day: string // YYYY-MM-DD
  title: string
  done: boolean
  priority: Priority
  goalId: string | null
  order: number
  createdAt: number
  doneAt: number | null
  remindAt: string | null // HH:MM
  notifiedAt: number | null
  repeatId: string | null
}

export interface Repeat {
  id: string
  title: string
  rule: RepeatRule
  priority: Priority
  goalId: string | null
  remindAt: string | null // HH:MM
  startDate: string
  active: boolean
  createdAt: number
}

export interface Goal {
  id: string
  title: string
  color: string
  target: number // сколько задач нужно закрыть, 0 — без цели
  createdAt: number
  archived: boolean
}

export interface AppState {
  version: number
  tasks: Task[]
  goals: Goal[]
  repeats: Repeat[]
  repeatLog: Record<string, true> // `${repeatId}|${day}` — повтор уже создан
  notes: Record<string, string> // день -> заметка
  accent: string
  remindersOn: boolean
}
