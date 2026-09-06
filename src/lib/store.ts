import { useSyncExternalStore } from 'react'
import type { AppState, Goal, Priority, Task } from '../types'
import { todayKey } from './date'

const STORAGE_KEY = 'ezednevnik.v1'
export const ACCENTS = ['#7c5cff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

const emptyState: AppState = {
  version: 1,
  tasks: [],
  goals: [],
  notes: {},
  accent: ACCENTS[0],
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...emptyState,
      ...parsed,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    }
  } catch {
    return emptyState
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()
let saveTimer: number | undefined

function persist() {
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* переполнение хранилища — игнорируем, данные остаются в памяти */
    }
  }, 120)
}

function set(next: AppState) {
  state = next
  persist()
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function snapshot() {
  return state
}

export function useStore(): AppState {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

// ——— задачи ———

export function addTask(day: string, title: string, priority: Priority = 0, goalId: string | null = null) {
  const trimmed = title.trim()
  if (!trimmed) return
  const maxOrder = state.tasks
    .filter((t) => t.day === day)
    .reduce((max, t) => Math.max(max, t.order), -1)
  const task: Task = {
    id: uid(),
    day,
    title: trimmed,
    done: false,
    priority,
    goalId,
    order: maxOrder + 1,
    createdAt: Date.now(),
    doneAt: null,
  }
  set({ ...state, tasks: [...state.tasks, task] })
}

export function toggleTask(id: string) {
  set({
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done, doneAt: t.done ? null : Date.now() } : t,
    ),
  })
}

export function updateTask(id: string, patch: Partial<Omit<Task, 'id'>>) {
  set({ ...state, tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
}

export function removeTask(id: string) {
  set({ ...state, tasks: state.tasks.filter((t) => t.id !== id) })
}

export function cyclePriority(id: string) {
  const task = state.tasks.find((t) => t.id === id)
  if (!task) return
  updateTask(id, { priority: (((task.priority + 1) % 3) as Priority) })
}

export function moveTask(id: string, direction: -1 | 1) {
  const task = state.tasks.find((t) => t.id === id)
  if (!task) return
  const siblings = state.tasks
    .filter((t) => t.day === task.day)
    .sort((a, b) => a.order - b.order)
  const index = siblings.findIndex((t) => t.id === id)
  const target = index + direction
  if (target < 0 || target >= siblings.length) return
  const reordered = [...siblings]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
  const orderById = new Map(reordered.map((t, i) => [t.id, i]))
  set({
    ...state,
    tasks: state.tasks.map((t) => (orderById.has(t.id) ? { ...t, order: orderById.get(t.id)! } : t)),
  })
}

/** Перетаскивание: ставит задачу dragId на место задачи overId внутри одного дня. */
export function reorderTask(dragId: string, overId: string) {
  if (dragId === overId) return
  const task = state.tasks.find((t) => t.id === dragId)
  if (!task) return
  const siblings = state.tasks
    .filter((t) => t.day === task.day)
    .sort((a, b) => a.order - b.order)
  const from = siblings.findIndex((t) => t.id === dragId)
  const to = siblings.findIndex((t) => t.id === overId)
  if (from < 0 || to < 0) return
  const reordered = [...siblings]
  reordered.splice(to, 0, reordered.splice(from, 1)[0])
  const orderById = new Map(reordered.map((t, i) => [t.id, i]))
  set({
    ...state,
    tasks: state.tasks.map((t) => (orderById.has(t.id) ? { ...t, order: orderById.get(t.id)! } : t)),
  })
}

/** Переносит все незакрытые задачи дня на другой день. */
export function moveUndone(fromDay: string, toDay: string): number {
  const moving = state.tasks.filter((t) => t.day === fromDay && !t.done)
  if (!moving.length) return 0
  let order = state.tasks
    .filter((t) => t.day === toDay)
    .reduce((max, t) => Math.max(max, t.order), -1)
  const movingIds = new Set(moving.map((t) => t.id))
  set({
    ...state,
    tasks: state.tasks.map((t) => (movingIds.has(t.id) ? { ...t, day: toDay, order: ++order } : t)),
  })
  return moving.length
}

export function clearDone(day: string) {
  set({ ...state, tasks: state.tasks.filter((t) => !(t.day === day && t.done)) })
}

// ——— цели ———

export function addGoal(title: string, color: string, target: number) {
  const trimmed = title.trim()
  if (!trimmed) return
  const goal: Goal = {
    id: uid(),
    title: trimmed,
    color,
    target: Math.max(0, target | 0),
    createdAt: Date.now(),
    archived: false,
  }
  set({ ...state, goals: [...state.goals, goal] })
}

export function updateGoal(id: string, patch: Partial<Omit<Goal, 'id'>>) {
  set({ ...state, goals: state.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
}

export function removeGoal(id: string) {
  set({
    ...state,
    goals: state.goals.filter((g) => g.id !== id),
    tasks: state.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
  })
}

// ——— заметки и настройки ———

export function setNote(day: string, text: string) {
  const notes = { ...state.notes }
  if (text.trim()) notes[day] = text
  else delete notes[day]
  set({ ...state, notes })
}

export function setAccent(accent: string) {
  set({ ...state, accent })
}

// ——— бэкап ———

export function exportData(): string {
  return JSON.stringify(state, null, 2)
}

export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Partial<AppState>
    if (!Array.isArray(parsed.tasks)) return false
    set({
      ...emptyState,
      ...parsed,
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    })
    return true
  } catch {
    return false
  }
}

export function resetAll() {
  set({ ...emptyState, accent: state.accent })
}

// ——— выборки ———

export function tasksOfDay(s: AppState, day: string): Task[] {
  return s.tasks.filter((t) => t.day === day).sort((a, b) => a.order - b.order)
}

export function dayStats(s: AppState, day: string) {
  let total = 0
  let done = 0
  for (const t of s.tasks) {
    if (t.day !== day) continue
    total++
    if (t.done) done++
  }
  return { total, done, ratio: total ? done / total : 0 }
}

/** Серия дней подряд (до сегодня), в которых все задачи закрыты. */
export function streak(s: AppState): number {
  const byDay = new Map<string, { total: number; done: number }>()
  for (const t of s.tasks) {
    const entry = byDay.get(t.day) ?? { total: 0, done: 0 }
    entry.total++
    if (t.done) entry.done++
    byDay.set(t.day, entry)
  }
  let count = 0
  const cursor = new Date()
  for (let i = 0; i < 400; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    const entry = byDay.get(key)
    if (entry && entry.total > 0) {
      if (entry.done === entry.total) count++
      else break
    } else if (key !== todayKey()) {
      break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

export function goalProgress(s: AppState, goalId: string) {
  let total = 0
  let done = 0
  for (const t of s.tasks) {
    if (t.goalId !== goalId) continue
    total++
    if (t.done) done++
  }
  return { total, done }
}
