import type { Repeat, RepeatRule } from '../types'
import { WEEKDAYS_SHORT, addDays, daysBetween, fromKey, weekdayIndex } from './date'

export function matchesDay(repeat: Repeat, day: string): boolean {
  if (!repeat.active) return false
  if (day < repeat.startDate) return false
  const rule = repeat.rule
  switch (rule.type) {
    case 'daily':
      return true
    case 'weekly':
      return rule.days.includes(weekdayIndex(day))
    case 'interval': {
      const every = Math.max(1, rule.every)
      return daysBetween(repeat.startDate, day) % every === 0
    }
    case 'monthly': {
      const d = fromKey(day)
      const inMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      return d.getDate() === Math.min(rule.day, inMonth)
    }
  }
}

export function nextOccurrence(repeat: Repeat, from: string): string | null {
  let cursor = from < repeat.startDate ? repeat.startDate : from
  for (let i = 0; i < 400; i++) {
    if (matchesDay(repeat, cursor)) return cursor
    cursor = addDays(cursor, 1)
  }
  return null
}

export function describeRule(rule: RepeatRule): string {
  switch (rule.type) {
    case 'daily':
      return 'каждый день'
    case 'weekly': {
      if (rule.days.length === 0) return 'дни не выбраны'
      if (rule.days.length === 7) return 'каждый день'
      const workdays = [0, 1, 2, 3, 4]
      if (rule.days.length === 5 && workdays.every((d) => rule.days.includes(d))) return 'по будням'
      if (rule.days.length === 2 && rule.days.includes(5) && rule.days.includes(6)) return 'по выходным'
      return 'по ' + [...rule.days].sort((a, b) => a - b).map((d) => WEEKDAYS_SHORT[d]).join(', ')
    }
    case 'interval':
      return rule.every === 1 ? 'каждый день' : `каждые ${rule.every} дн.`
    case 'monthly':
      return `${rule.day} числа каждый месяц`
  }
}
