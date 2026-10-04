import { MIN_PATTERN_SAMPLES, MISSED_WINDOW_MIN, PATTERN_LOOKBACK_DAYS, PATTERN_WINDOW } from './constants'
import { addDays, rangeDays } from './dates'
import type { Completion, HabitPattern, RoutineKey } from './types'

/**
 * Learns ONLY from the user's own completion times of one routine.
 * Uses the earliest completion of each of the most recent days (a changed
 * routine is naturally learned as old samples roll out of the window).
 */
export function analyzeHabitPattern(completions: Completion[], key: RoutineKey, today: string): HabitPattern {
  const lookback = new Set(rangeDays(today, PATTERN_LOOKBACK_DAYS))
  const firstPerDay = new Map<string, Completion>()
  for (const c of completions) {
    if (c.key !== key || !lookback.has(c.dayKey) || c.dayKey === today) continue
    const prev = firstPerDay.get(c.dayKey)
    if (!prev || c.ts < prev.ts) firstPerDay.set(c.dayKey, c)
  }
  const samples = [...firstPerDay.values()].sort((a, b) => b.ts - a.ts).slice(0, PATTERN_WINDOW)
  const minutes = samples.map((s) => s.minuteOfDay)
  const mean = minutes.length ? minutes.reduce((a, b) => a + b, 0) / minutes.length : 0
  const spread = minutes.length ? Math.sqrt(minutes.reduce((a, m) => a + (m - mean) ** 2, 0) / minutes.length) : 0
  const last7 = new Set(rangeDays(addDays(today, -1), 7))
  const done7 = [...firstPerDay.keys()].filter((d) => last7.has(d)).length
  const lastDay = [...new Set(completions.filter((c) => c.key === key).map((c) => c.dayKey))].sort().pop() ?? null
  return {
    key,
    sampleSize: samples.length,
    preferredMinute: samples.length >= MIN_PATTERN_SAMPLES ? Math.round(mean) : null,
    spreadMin: Math.round(spread),
    completionRate7: done7 / 7,
    lastCompletedDayKey: lastDay,
  }
}

export const completedOn = (completions: Completion[], key: RoutineKey, day: string): boolean =>
  completions.some((c) => c.key === key && c.dayKey === day)

/** Has the user's usual time passed (plus tolerance) without completing it today? */
export function isMissedNow(pattern: HabitPattern, nowMinute: number, doneToday: boolean, toleranceMin: number): boolean {
  if (doneToday || pattern.preferredMinute == null) return false
  const start = pattern.preferredMinute + toleranceMin
  return nowMinute >= start && nowMinute <= start + MISSED_WINDOW_MIN
}
