import { PRAYERS } from '@/domain/constants'
import type { PrayerId, PrayerTimesMap } from '@/domain/types'

/**
 * Prayer-time provider contract. The app works fully without prayer times
 * (users mark prayers manually); this provider is OPT-IN from Settings.
 */
export interface PrayerTimesProvider {
  getTimes(dayKey: string): Promise<PrayerTimesMap | null>
}

export const nullPrayerTimes: PrayerTimesProvider = { getTimes: async () => null }

/** Calculation methods offered in Settings (ids from the Aladhan API). null = closest authority. */
export const PRAYER_METHODS: { id: number | null; label: string }[] = [
  { id: null, label: 'Automatic (closest authority)' },
  { id: 3, label: 'Muslim World League' },
  { id: 2, label: 'ISNA (North America)' },
  { id: 4, label: 'Umm al-Qura (Makkah)' },
  { id: 5, label: 'Egyptian General Authority' },
  { id: 1, label: 'Karachi (Islamic Sciences)' },
  { id: 12, label: 'France (UOIF)' },
  { id: 21, label: 'Morocco' },
  { id: 19, label: 'Algeria' },
  { id: 18, label: 'Tunisia' },
  { id: 13, label: 'Turkey (Diyanet)' },
]

const API = 'https://api.aladhan.com/v1/timings'
const TIMEOUT_MS = 10_000
const HHMM = /^(\d{1,2}):(\d{2})/

/** dayKey "YYYY-MM-DD" → "DD-MM-YYYY" as the API expects. */
const apiDate = (dayKey: string): string => dayKey.split('-').reverse().join('-')

/** Accepts "05:12" or "05:12 (CEST)" and returns "05:12" — anything else is rejected. */
function cleanTime(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const m = HHMM.exec(v.trim())
  if (!m) return null
  const h = Number(m[1]), min = Number(m[2])
  if (h > 23 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${m[2]}`
}

const FIELD: Record<PrayerId, string> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }

/** Pure parser (kept separate so it is easy to test). Returns null on any malformed response. */
export function parseTimings(json: unknown): PrayerTimesMap | null {
  const timings = (json as { data?: { timings?: Record<string, unknown> } } | null)?.data?.timings
  if (!timings || typeof timings !== 'object') return null
  const out = {} as PrayerTimesMap
  for (const p of PRAYERS) {
    const t = cleanTime(timings[FIELD[p]])
    if (!t) return null
    out[p] = t
  }
  return out
}

export interface PrayerQuery { lat: number; lng: number; method: number | null }

/** Fetches one day's times from the Aladhan public API. Resolves null on any failure (offline, bad data). */
export async function fetchPrayerTimes(dayKey: string, q: PrayerQuery): Promise<PrayerTimesMap | null> {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const params = new URLSearchParams({ latitude: String(q.lat), longitude: String(q.lng) })
    if (q.method != null) params.set('method', String(q.method))
    // Ask for times in the device's own timezone so they match the phone clock.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz) params.set('timezonestring', tz)
    const res = await fetch(`${API}/${apiDate(dayKey)}?${params}`, { signal: ctrl.signal })
    if (!res.ok) return null
    return parseTimings(await res.json())
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

export const aladhanProvider = (q: PrayerQuery): PrayerTimesProvider => ({ getTimes: (dayKey) => fetchPrayerTimes(dayKey, q) })

/** Asks the device for its approximate position; coordinates are rounded to 2 decimals (~1 km) for privacy. */
export function locateDevice(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) { reject(new Error('unsupported')); return }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: Math.round(p.coords.latitude * 100) / 100, lng: Math.round(p.coords.longitude * 100) / 100 }),
      (e) => reject(new Error(e.code === 1 ? 'denied' : 'failed')),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 3_600_000 },
    )
  })
}
