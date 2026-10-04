import { MIN_ACTIVE_COUNT } from './constants'
import { addDays, diffDays, rangeDays, weekdayOf } from './dates'
import type { ActiveSession, AppData, Completion, DailyProgress, DailyInsight, DhikrSession, RoutineKey, Streak } from './types'

/** Seconds counted for the live (unsaved) session. */
const activeSec = (a: ActiveSession) => Math.round(a.activeMs / 1000)

export function totalsByDay(data: Pick<AppData, 'sessions' | 'active'>): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of data.sessions) m.set(s.dayKey, (m.get(s.dayKey) ?? 0) + s.count)
  if (data.active && data.active.count > 0) m.set(data.active.dayKey, (m.get(data.active.dayKey) ?? 0) + data.active.count)
  return m
}

export function getDayProgress(data: AppData, dayKey: string): DailyProgress {
  const list: DhikrSession[] = data.sessions.filter((s) => s.dayKey === dayKey)
  const perDhikr = new Map<string, number>()
  let total = 0
  let secs = 0
  for (const s of list) {
    total += s.count
    secs += s.activeSec
    perDhikr.set(s.dhikrId, (perDhikr.get(s.dhikrId) ?? 0) + s.count)
  }
  const a = data.active
  if (a && a.dayKey === dayKey && a.count > 0) {
    total += a.count
    secs += activeSec(a)
    perDhikr.set(a.dhikrId, (perDhikr.get(a.dhikrId) ?? 0) + a.count)
  }
  let top: string | null = null
  let best = 0
  perDhikr.forEach((v, k) => { if (v > best) { best = v; top = k } })
  const goal = Math.max(1, data.settings.dailyGoal)
  return {
    dayKey, total, minutes: Math.round(secs / 60), routines: data.completions.filter((c) => c.dayKey === dayKey).map((c) => c.key),
    goalPct: Math.min(100, Math.round((total / goal) * 100)), topDhikrId: top,
  }
}

export const activeDaySet = (data: AppData): Set<string> => {
  const s = new Set<string>()
  totalsByDay(data).forEach((v, k) => { if (v >= MIN_ACTIVE_COUNT) s.add(k) })
  return s
}

/** Consecutive days. A streak stays alive through "today" until the day ends. */
export function computeStreak(days: Set<string>, today: string): Streak {
  let current = 0
  let cursor = days.has(today) ? today : addDays(today, -1)
  while (days.has(cursor)) { current++; cursor = addDays(cursor, -1) }
  const sorted = [...days].sort()
  let longest = 0
  let run = 0
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && diffDays(sorted[i], sorted[i - 1]) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }
  return { current, longest, lastActiveDayKey: sorted.length ? sorted[sorted.length - 1] : null }
}

/** Consistency of one specific routine (its own "chain"). */
export function routineChain(completions: Completion[], key: RoutineKey, today: string): number {
  const days = new Set(completions.filter((c) => c.key === key).map((c) => c.dayKey))
  let cursor = days.has(today) ? today : addDays(today, -1)
  let n = 0
  while (days.has(cursor)) { n++; cursor = addDays(cursor, -1) }
  return n
}

export const consistency = (days: Set<string>, today: string, n: number): number =>
  rangeDays(today, n).filter((d) => days.has(d)).length

export function lifetime(data: AppData) {
  const totals = totalsByDay(data)
  let count = 0
  totals.forEach((v) => { count += v })
  const seconds = data.sessions.reduce((a, s) => a + s.activeSec, 0) + (data.active ? activeSec(data.active) : 0)
  return { count, minutes: Math.round(seconds / 60), days: totals.size }
}

type Bucket = 'morning' | 'afternoon' | 'evening' | 'night'
const bucketOf = (minute: number): Bucket => {
  const h = (minute / 60) % 24
  return h >= 4 && h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'
}

export function buildInsights(data: AppData, today: string): DailyInsight[] {
  const out: DailyInsight[] = []
  const days = activeDaySet(data)
  const life = lifetime(data)
  if (life.count === 0) return out
  const streak = computeStreak(days, today)
  const last30 = consistency(days, today, 30)
  out.push({ id: 'total', params: { n: life.count.toLocaleString() } })
  if (last30 >= 3) out.push({ id: 'days30', params: { n: last30 } })
  const avg = Math.round(life.count / Math.max(1, life.days))
  out.push({ id: 'avg', params: { n: avg } })
  if (streak.longest >= 2) out.push({ id: 'longest', params: { n: streak.longest } })

  const byWeekday = new Array(7).fill(0) as number[]
  totalsByDay(data).forEach((v, k) => { byWeekday[weekdayOf(k)] += v })
  const best = byWeekday.indexOf(Math.max(...byWeekday))
  if (life.days >= 7 && byWeekday[best] > 0) out.push({ id: 'weekday', params: { d: best } })

  const buckets: Record<Bucket, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 }
  for (const s of data.sessions) buckets[bucketOf((s.startedAt % 86_400_000) / 60_000 + s.tzOffsetMin)]++
  const topBucket = (Object.keys(buckets) as Bucket[]).sort((a, b) => buckets[b] - buckets[a])[0]
  if (data.sessions.length >= 5 && buckets[topBucket] > 0) out.push({ id: 'time', params: { b: topBucket } })

  for (const key of ['morning', 'evening', 'sleep'] as RoutineKey[]) {
    const n = routineChain(data.completions, key, today)
    if (n >= 2) out.push({ id: 'chain', params: { n, key } })
  }
  return out
}

/** Routine with the lowest completion over the last 14 days (needs some history). */
export function mostMissedRoutine(data: AppData, today: string): RoutineKey | null {
  const window = new Set(rangeDays(today, 14))
  if (data.completions.filter((c) => window.has(c.dayKey)).length < 3) return null
  const keys: RoutineKey[] = ['morning', 'evening', 'sleep']
  const counts = keys.map((k) => new Set(data.completions.filter((c) => c.key === k && window.has(c.dayKey)).map((c) => c.dayKey)).size)
  const min = Math.min(...counts)
  return min >= 14 ? null : keys[counts.indexOf(min)]
}
