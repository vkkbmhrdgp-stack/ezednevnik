export type Priority = 0 | 1 | 2 // 0 — обычная, 1 — важная, 2 — срочная

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
  notes: Record<string, string> // день -> заметка
  accent: string
}
