import { SEC_PER_COUNT, TRANSITION_SEC } from './constants'
import { uid } from './dates'
import type { AppData, DhikrRoutine, RoutineItem, RoutineSlot } from './types'

export const estimateSeconds = (items: RoutineItem[]): number =>
  Math.round(items.reduce((a, i) => a + i.count * SEC_PER_COUNT + TRANSITION_SEC, 0))

export const totalReps = (items: RoutineItem[]): number => items.reduce((a, i) => a + i.count, 0)

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night'
export const dayPartOf = (hour: number): DayPart => (hour < 12 && hour >= 4 ? 'morning' : hour < 17 && hour >= 12 ? 'afternoon' : hour < 21 && hour >= 17 ? 'evening' : 'night')

export const slotForHour = (hour: number): Exclude<RoutineSlot, null | 'afterPrayer' | 'friday'> =>
  hour >= 4 && hour < 12 ? 'morning' : hour >= 12 && hour < 21 ? 'evening' : 'sleep'

/** How many times each dhikr has been counted (sessions only). */
export function usageByDhikr(data: AppData): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of data.sessions) m.set(s.dhikrId, (m.get(s.dhikrId) ?? 0) + s.count)
  return m
}

/** Suggestion for a one-minute session: most-used favourite, else istighfar. */
export function suggestOneMinute(data: AppData): string {
  const usage = usageByDhikr(data)
  const favs = data.favorites.filter((f) => !!f).sort((a, b) => (usage.get(b) ?? 0) - (usage.get(a) ?? 0))
  return favs[0] ?? data.settings.defaultDhikrId ?? 'astaghfirullah'
}

/** A lighter version of a routine (~1/3 of each count, min 1). */
export function catchUpItems(routine: DhikrRoutine): RoutineItem[] {
  return routine.items.map((i) => ({ id: uid(), dhikrId: i.dhikrId, count: i.count <= 3 ? i.count : Math.max(3, Math.round(i.count / 3)) }))
}

/** Short ad-hoc session sized to `minutes`, based on time of day, routines and usage. */
export function buildTimedSession(data: AppData, minutes: number, hour: number): RoutineItem[] {
  const budget = minutes * 60
  const slot = slotForHour(hour)
  const base = data.routines.find((r) => r.slot === slot)
  const usage = usageByDhikr(data)
  const pool: { dhikrId: string; count: number }[] = []
  if (base) pool.push(...catchUpItems(base))
  const ranked = [...usage.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  for (const id of [...data.favorites, ...ranked, 'astaghfirullah', 'subhanallah', 'alhamdulillah', 'allahuakbar', 'salawat']) {
    pool.push({ dhikrId: id, count: 33 })
  }
  const out: RoutineItem[] = []
  let used = 0
  const seen = new Set<string>()
  for (const p of pool) {
    if (seen.has(p.dhikrId)) continue
    const secs = p.count * SEC_PER_COUNT + TRANSITION_SEC
    const room = budget - used
    if (room < TRANSITION_SEC + 5 * SEC_PER_COUNT) break
    const count = secs <= room ? p.count : Math.max(3, Math.floor((room - TRANSITION_SEC) / SEC_PER_COUNT))
    out.push({ id: uid(), dhikrId: p.dhikrId, count })
    seen.add(p.dhikrId)
    used += count * SEC_PER_COUNT + TRANSITION_SEC
  }
  return out
}
