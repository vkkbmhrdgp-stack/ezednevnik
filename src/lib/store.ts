import { useSyncExternalStore } from 'react'
import type { AppState, Goal, Priority, Repeat, RepeatRule, Task } from '../types'
import { todayKey } from './date'
import { matchesDay } from './repeats'

const STORAGE_KEY = 'ezednevnik.v1'
export const ACCENTS = ['#7c5cff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

const emptyState: AppState = {
  version: 2,
  tasks: [],
  goals: [],
  repeats: [],
  repeatLog: {},
  notes: {},
  accent: ACCENTS[0],
  remindersOn: false,
}

/** Дополняет данные старых версий полями, появившимися позже. */
function migrate(raw: Partial<AppState>): AppState {
  return {
    ...emptyState,
    ...raw,
    version: 2,
    tasks: (Array.isArray(raw.tasks) ? raw.tasks : []).map((t: Task) => ({
      ...t,
      remindAt: t.remindAt ?? null,
      notifiedAt: t.notifiedAt ?? null,
      repeatId: t.repeatId ?? null,
    })),
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    repeats: Array.isArray(raw.repeats) ? raw.repeats : [],
    repeatLog: raw.repeatLog && typeof raw.repeatLog === 'object' ? raw.repeatLog : {},
    notes: raw.notes && typeof raw.notes === 'object' ? raw.notes : {},
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState
    return migrate(JSON.parse(raw) as Partial<AppState>)
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

export function addTask(
  day: string,
  title: string,
  priority: Priority = 0,
  goalId: string | null = null,
  remindAt: string | null = null,
) {
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
    remindAt,
    notifiedAt: null,
    repeatId: null,
  }
  set({ ...state, tasks: [...state.tasks, task] })
}

export function setReminder(id: string, remindAt: string | null) {
  updateTask(id, { remindAt, notifiedAt: null })
}

export function markNotified(ids: string[]) {
  if (!ids.length) return
  const set2 = new Set(ids)
  const now = Date.now()
  set({
    ...state,
    tasks: state.tasks.map((t) => (set2.has(t.id) ? { ...t, notifiedAt: now } : t)),
  })
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

export function setRemindersOn(remindersOn: boolean) {
  set({ ...state, remindersOn })
}

// ——— повторяющиеся задачи ———

export function addRepeat(input: {
  title: string
  rule: RepeatRule
  priority?: Priority
  goalId?: string | null
  remindAt?: string | null
  startDate: string
}) {
  const title = input.title.trim()
  if (!title) return
  const repeat: Repeat = {
    id: uid(),
    title,
    rule: input.rule,
    priority: input.priority ?? 0,
    goalId: input.goalId ?? null,
    remindAt: input.remindAt ?? null,
    startDate: input.startDate,
    active: true,
    createdAt: Date.now(),
  }
  set({ ...state, repeats: [...state.repeats, repeat] })
}

export function updateRepeat(id: string, patch: Partial<Omit<Repeat, 'id'>>) {
  set({ ...state, repeats: state.repeats.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
}

/**
 * Пауза убирает уже созданные задачи следующих дней, включение — разрешает
 * создать их заново.
 */
export function toggleRepeat(id: string) {
  const repeat = state.repeats.find((r) => r.id === id)
  if (!repeat) return
  const today = todayKey()
  const active = !repeat.active
  const log: Record<string, true> = {}
  for (const key of Object.keys(state.repeatLog)) {
    const [repeatId, day] = key.split('|')
    if (active && repeatId === id && day > today) continue // дать повтору развернуться заново
    log[key] = true
  }
  set({
    ...state,
    repeats: state.repeats.map((r) => (r.id === id ? { ...r, active } : r)),
    repeatLog: log,
    tasks: active
      ? state.tasks
      : state.tasks.filter((t) => !(t.repeatId === id && !t.done && t.day > today)),
  })
}

/** Удаляет повтор; будущие созданные им задачи тоже убираются. */
export function removeRepeat(id: string) {
  const today = todayKey()
  const log: Record<string, true> = {}
  for (const key of Object.keys(state.repeatLog)) {
    if (!key.startsWith(`${id}|`)) log[key] = true
  }
  set({
    ...state,
    repeats: state.repeats.filter((r) => r.id !== id),
    repeatLog: log,
    tasks: state.tasks.filter((t) => !(t.repeatId === id && !t.done && t.day >= today)),
  })
}

/**
 * Создаёт задачи из повторов на переданные дни (сегодня и позже).
 * Каждая пара «повтор + день» разворачивается один раз, поэтому удалённая
 * задача не появляется снова.
 */
export function materialize(days: string[]) {
  if (!state.repeats.length) return
  const today = todayKey()
  const created: Task[] = []
  const log = { ...state.repeatLog }
  const orderByDay = new Map<string, number>()

  for (const day of days) {
    if (day < today) continue
    for (const repeat of state.repeats) {
      const key = `${repeat.id}|${day}`
      if (log[key]) continue
      if (!matchesDay(repeat, day)) continue
      log[key] = true
      let order = orderByDay.get(day)
      if (order === undefined) {
        order = state.tasks.filter((t) => t.day === day).reduce((max, t) => Math.max(max, t.order), -1)
      }
      order += 1
      orderByDay.set(day, order)
      created.push({
        id: uid(),
        day,
        title: repeat.title,
        done: false,
        priority: repeat.priority,
        goalId: repeat.goalId,
        order,
        createdAt: Date.now(),
        doneAt: null,
        remindAt: repeat.remindAt,
        notifiedAt: null,
        repeatId: repeat.id,
      })
    }
  }

  if (!created.length) return
  set({ ...state, tasks: [...state.tasks, ...created], repeatLog: log })
}

// ——— бэкап ———

export function exportData(): string {
  return JSON.stringify(state, null, 2)
}

export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Partial<AppState>
    if (!Array.isArray(parsed.tasks)) return false
    set(migrate(parsed))
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
