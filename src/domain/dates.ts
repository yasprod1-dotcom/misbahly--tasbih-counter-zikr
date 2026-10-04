// Timezone-safe date helpers. Every function accepts an explicit offset so
// tests can simulate any timezone / midnight / DST shift deterministically.
const MIN = 60_000
const DAY = 86_400_000

export const tzOffsetMin = (ts: number): number => -new Date(ts).getTimezoneOffset()
const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar day of `ts`, honouring a "day starts at N o'clock" preference. */
export function dayKeyOf(ts: number, startHour = 0, offsetMin = tzOffsetMin(ts)): string {
  const d = new Date(ts + offsetMin * MIN - startHour * 3_600_000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

const keyToUtc = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export const addDays = (key: string, n: number): string => {
  const d = new Date(keyToUtc(key) + n * DAY)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export const diffDays = (a: string, b: string): number => Math.round((keyToUtc(a) - keyToUtc(b)) / DAY)
/** 0 = Sunday … 6 = Saturday. */
export const weekdayOf = (key: string): number => new Date(keyToUtc(key)).getUTCDay()
export const isFriday = (key: string): boolean => weekdayOf(key) === 5

/** Minutes since local midnight of `dayKey` (can exceed 1440 past midnight). */
export function minuteOfDay(ts: number, dayKey: string, offsetMin = tzOffsetMin(ts)): number {
  return Math.floor((ts + offsetMin * MIN - keyToUtc(dayKey)) / MIN)
}

/** Timestamp of "HH:mm" on the given day in the given offset. */
export function timeOnDay(dayKey: string, hhmm: string, offsetMin: number): number {
  const [h, m] = hhmm.split(':').map(Number)
  return keyToUtc(dayKey) + (h * 60 + m) * MIN - offsetMin * MIN
}

export const hhmmToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const minutesToHhmm = (min: number): string => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

export const rangeDays = (endKey: string, n: number): string[] =>
  Array.from({ length: n }, (_, i) => addDays(endKey, -(n - 1 - i)))

export const uid = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const formatDuration = (sec: number): string => {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  return m === 0 ? `${s}s` : `${m}m ${pad(s % 60)}s`
}
