import { useMemo } from 'react'
import { allDhikr } from '@/content/contentProvider'
import { analyzeHabitPattern, completedOn, isMissedNow } from '@/domain/habits'
import { minuteOfDay, tzOffsetMin, addDays } from '@/domain/dates'
import { activeDaySet, buildInsights, computeStreak, consistency, getDayProgress, lifetime, routineChain } from '@/domain/stats'
import type { DhikrRoutine, HabitPattern, RoutineKey } from '@/domain/types'
import { PRAYERS } from '@/domain/constants'
import { useStore } from '@/store/AppStore'

export type Status = 'done' | 'partial' | 'none'

export function useDerived() {
  const { data, today } = useStore()
  const dhikr = useMemo(() => allDhikr(data.customDhikr), [data.customDhikr])
  const byId = useMemo(() => new Map(dhikr.map((d) => [d.id, d])), [dhikr])
  const progress = useMemo(() => getDayProgress(data, today), [data, today])
  const days = useMemo(() => activeDaySet(data), [data.sessions, data.active?.count, data.active?.dayKey])
  const streak = useMemo(() => computeStreak(days, today), [days, today])
  const life = useMemo(() => lifetime(data), [data.sessions, data.active?.count])
  const insights = useMemo(() => buildInsights(data, today), [data.sessions, data.completions, today])
  const prayersDone = PRAYERS.filter((p) => completedOn(data.completions, p, today)).length
  const slotStatus = (key: RoutineKey): Status => (completedOn(data.completions, key, today) ? 'done' : 'none')
  const routineFor = (slot: DhikrRoutine['slot']) => data.routines.find((r) => r.slot === slot) ?? null
  const patterns = useMemo(() => {
    const out = {} as Record<'morning' | 'evening' | 'sleep', HabitPattern>
    for (const k of ['morning', 'evening', 'sleep'] as const) out[k] = analyzeHabitPattern(data.completions, k, today)
    return out
  }, [data.completions, today])

  /** Slots the user usually does by now but hasn't today (powers the "missed" card). */
  const missed = (now = Date.now()): RoutineKey[] => {
    const nowMin = minuteOfDay(now, today, tzOffsetMin(now))
    return (['morning', 'evening', 'sleep'] as const).filter((k) =>
      isMissedNow(patterns[k], nowMin, completedOn(data.completions, k, today), data.settings.notifications.toleranceMin))
  }
  const yesterdayDone = (key: RoutineKey) => completedOn(data.completions, key, addDays(today, -1))
  return {
    data, today, dhikr, byId, progress, streak, life, insights, prayersDone, slotStatus, routineFor, patterns, missed, yesterdayDone,
    days, week: consistency(days, today, 7), month: consistency(days, today, 30), chain: (k: RoutineKey) => routineChain(data.completions, k, today),
  }
}
