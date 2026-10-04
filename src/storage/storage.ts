import { MAX_COUNT, MAX_SESSIONS, STORAGE_KEY, STORAGE_VERSION, WIDGET_KEY } from '@/domain/constants'
import { dayKeyOf } from '@/domain/dates'
import { getDayProgress } from '@/domain/stats'
import type { ActiveSession, AppData, Completion, DhikrSession } from '@/domain/types'
import { createDefaultData, defaultProfile, defaultSettings } from './defaults'

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const clampCount = (v: unknown) => Math.max(0, Math.min(MAX_COUNT, Math.floor(num(v))))
const arr = <T,>(v: unknown, ok: (x: unknown) => boolean): T[] => (Array.isArray(v) ? (v.filter(ok) as T[]) : [])

const validSession = (x: unknown) => isObj(x) && typeof x.id === 'string' && typeof x.dhikrId === 'string' && typeof x.dayKey === 'string' && Number.isFinite(x.count)
const validCompletion = (x: unknown) => isObj(x) && typeof x.id === 'string' && typeof x.key === 'string' && typeof x.dayKey === 'string' && Number.isFinite(x.ts)

function sanitizeActive(v: unknown): ActiveSession | null {
  if (!isObj(v) || typeof v.dhikrId !== 'string' || typeof v.dayKey !== 'string') return null
  const a = v as unknown as ActiveSession
  return { ...a, count: clampCount(a.count), target: Math.max(1, clampCount(a.target) || 33), paused: !!a.paused, activeMs: Math.max(0, num(a.activeMs)) }
}

/** Never trust persisted data: merge over defaults, drop malformed records, clamp counters. */
export function sanitize(raw: unknown, now: number): AppData {
  const base = createDefaultData(now)
  if (!isObj(raw)) return base
  const d = raw as Partial<AppData>
  const settings = { ...defaultSettings(), ...(isObj(d.settings) ? d.settings : {}) }
  settings.notifications = { ...defaultSettings().notifications, ...(isObj(d.settings?.notifications) ? d.settings!.notifications : {}) }
  settings.prayerTimes = { ...defaultSettings().prayerTimes, ...(isObj(d.settings?.prayerTimes) ? d.settings!.prayerTimes : {}) }
  if (!Array.isArray(settings.prayerTimes.remind)) settings.prayerTimes.remind = []
  settings.ramadan = { ...defaultSettings().ramadan, ...(isObj(d.settings?.ramadan) ? d.settings!.ramadan : {}) }
  settings.dailyGoal = Math.max(1, clampCount(settings.dailyGoal) || 300)
  const routines = Array.isArray(d.routines) && d.routines.length ? d.routines.filter((r) => isObj(r) && Array.isArray(r.items)) : base.routines
  return {
    ...base,
    version: STORAGE_VERSION,
    profile: { ...defaultProfile(now), ...(isObj(d.profile) ? d.profile : {}) },
    settings,
    customDhikr: arr(d.customDhikr, (x) => isObj(x) && typeof x.id === 'string'),
    favorites: arr<string>(d.favorites, (x) => typeof x === 'string'),
    routines,
    sessions: arr<DhikrSession>(d.sessions, validSession).slice(-MAX_SESSIONS).map((s) => ({ ...s, count: clampCount(s.count) })),
    completions: arr<Completion>(d.completions, validCompletion),
    active: sanitizeActive(d.active),
    unfinished: isObj(d.unfinished) ? (d.unfinished as AppData['unfinished']) : null,
    moods: arr(d.moods, (x) => isObj(x) && typeof x.id === 'string'),
    notificationLog: arr(d.notificationLog, (x) => isObj(x) && typeof x.id === 'string'),
    ignoredByKind: isObj(d.ignoredByKind) ? (d.ignoredByKind as Record<string, number>) : {},
    lastOpenedAt: num(d.lastOpenedAt, now),
    lastFinishedRun: isObj(d.lastFinishedRun) ? (d.lastFinishedRun as AppData['lastFinishedRun']) : null,
  }
}

export function loadData(now = Date.now()): AppData {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) return createDefaultData(now)
    return sanitize(JSON.parse(text), now)
  } catch {
    // Corrupted storage must never crash the app — keep a backup and start clean.
    try { const bad = localStorage.getItem(STORAGE_KEY); if (bad) localStorage.setItem(`${STORAGE_KEY}:corrupt`, bad) } catch { /* ignore */ }
    return createDefaultData(now)
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const today = dayKeyOf(Date.now(), data.settings.startOfDayHour)
    const p = getDayProgress(data, today)
    localStorage.setItem(WIDGET_KEY, JSON.stringify({ dayKey: today, total: p.total, goal: data.settings.dailyGoal }))
    return true
  } catch {
    return false
  }
}

export const clearAllData = () => {
  try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(WIDGET_KEY) } catch { /* ignore */ }
}
