import { PRAYERS } from './constants'
import { hhmmToMinutes } from './dates'
import type { PrayerId, PrayerTimesMap, PrayerTimesSettings } from './types'

/** Identifies what the cached times were calculated for, so a changed place/method refetches. */
export const prayerSig = (pt: Pick<PrayerTimesSettings, 'lat' | 'lng' | 'method'>): string => `${pt.lat},${pt.lng},${pt.method ?? 'auto'}`

/** Today's times — only when the feature is on and the cache matches today + current settings. */
export function todaysPrayerTimes(pt: PrayerTimesSettings, today: string): PrayerTimesMap | null {
  if (!pt.enabled || !pt.times) return null
  if (pt.times.dayKey !== today || pt.times.sig !== prayerSig(pt)) return null
  return pt.times.values
}

export interface PrayerState {
  /** Prayers whose time has come today. */
  passed: PrayerId[]
  /** The next prayer still to come (null after Isha). */
  next: PrayerId | null
  /** The most recent prayer whose time has come. */
  latest: PrayerId | null
  minutesSinceLatest: number | null
}

export function prayerState(times: PrayerTimesMap, nowMinute: number): PrayerState {
  const passed = PRAYERS.filter((p) => hhmmToMinutes(times[p]) <= nowMinute)
  const latest = passed[passed.length - 1] ?? null
  return {
    passed,
    next: PRAYERS.find((p) => hhmmToMinutes(times[p]) > nowMinute) ?? null,
    latest,
    minutesSinceLatest: latest ? nowMinute - hhmmToMinutes(times[latest]) : null,
  }
}
