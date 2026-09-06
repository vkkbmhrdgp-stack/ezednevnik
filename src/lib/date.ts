export const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]
export const WEEKDAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
export const WEEKDAYS_FULL = [
  'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье',
]

export function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(): string {
  return toKey(new Date())
}

export function addDays(key: string, delta: number): string {
  const d = fromKey(key)
  d.setDate(d.getDate() + delta)
  return toKey(d)
}

/** Индекс дня недели, где 0 — понедельник. */
export function weekdayIndex(key: string): number {
  return (fromKey(key).getDay() + 6) % 7
}

export function startOfWeek(key: string): string {
  return addDays(key, -weekdayIndex(key))
}

export function weekDays(anchor: string): string[] {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function formatLong(key: string): string {
  const d = fromKey(key)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function formatFull(key: string): string {
  const d = fromKey(key)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function relativeLabel(key: string): string | null {
  const t = todayKey()
  if (key === t) return 'сегодня'
  if (key === addDays(t, 1)) return 'завтра'
  if (key === addDays(t, -1)) return 'вчера'
  return null
}

export function isPast(key: string): boolean {
  return key < todayKey()
}

export function daysBetween(a: string, b: string): number {
  const ms = fromKey(b).getTime() - fromKey(a).getTime()
  return Math.round(ms / 86400000)
}

export const MONTHS_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

/** Сетка месяца: полные недели с понедельника, включая хвосты соседних месяцев. */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1)
  const start = startOfWeek(toKey(first))
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = weekdayIndex(toKey(first))
  const weeks = Math.ceil((offset + daysInMonth) / 7)
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i))
}
