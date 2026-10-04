import { IDLE_CAP_MS, LOG_KEEP_DAYS, MAX_COUNT } from '@/domain/constants'
import { addDays, dayKeyOf, minuteOfDay, tzOffsetMin, uid } from '@/domain/dates'
import type {
  ActiveSession, AppData, AppSettings, Completion, Dhikr, DhikrRoutine, MoodEntry, NotificationEvent,
  NotificationPreference, PrayerTimesSettings, RoutineKey, RunState, SessionKind, UserProfile, DhikrSession,
} from '@/domain/types'
import { createDefaultData } from '@/storage/defaults'

export type Action =
  | { type: 'LOAD'; data: AppData }
  | { type: 'SET_SETTINGS'; patch: Partial<AppSettings> }
  | { type: 'SET_NOTIF'; patch: Partial<NotificationPreference> }
  | { type: 'SET_PROFILE'; patch: Partial<UserProfile> }
  | { type: 'SET_PRAYER'; patch: Partial<PrayerTimesSettings> }
  | { type: 'START_ACTIVE'; dhikrId: string; target: number; kind?: SessionKind; startCount?: number; now: number }
  | { type: 'TAP'; now: number }
  | { type: 'UNDO' }
  | { type: 'RESET_ACTIVE' }
  | { type: 'SET_TARGET'; target: number }
  | { type: 'SET_PAUSED'; paused: boolean; now: number }
  | { type: 'FINISH_ACTIVE'; now: number; completed?: boolean }
  | { type: 'START_RUN'; run: Omit<RunState, 'index' | 'done'>; now: number }
  | { type: 'RUN_SKIP'; now: number }
  | { type: 'MARK_DONE'; key: RoutineKey; now: number }
  | { type: 'UNMARK'; key: RoutineKey; dayKey: string }
  | { type: 'ROLLOVER'; now: number }
  | { type: 'TOGGLE_FAV'; id: string }
  | { type: 'SAVE_CUSTOM'; dhikr: Dhikr }
  | { type: 'DELETE_CUSTOM'; id: string }
  | { type: 'SAVE_ROUTINE'; routine: DhikrRoutine }
  | { type: 'DELETE_ROUTINE'; id: string }
  | { type: 'ADD_MOOD'; entry: MoodEntry }
  | { type: 'NOTIF_SENT'; event: NotificationEvent }
  | { type: 'NOTIF_RECONCILE'; log: NotificationEvent[]; ignoredByKind: Record<string, number> }
  | { type: 'OPENED'; now: number }
  | { type: 'RESET_HISTORY'; now: number }
  | { type: 'DELETE_ALL'; now: number }

const clamp = (n: number) => Math.max(0, Math.min(MAX_COUNT, n))
const dayOf = (s: AppSettings, now: number) => dayKeyOf(now, s.startOfDayHour)

function makeSession(a: ActiveSession, now: number, completed: boolean, routineId: string | null, kind: SessionKind): DhikrSession {
  return {
    id: uid(), dhikrId: a.dhikrId, routineId, kind, count: a.count, target: a.target, startedAt: a.startedAt, endedAt: now,
    activeSec: kind === 'oneMinute' && completed ? Math.max(60, Math.round(a.activeMs / 1000)) : Math.round(a.activeMs / 1000), completed, dayKey: a.dayKey, tzOffsetMin: a.tzOffsetMin,
  }
}

function makeCompletion(key: RoutineKey, routineId: string | null, now: number, s: AppSettings): Completion {
  const off = tzOffsetMin(now)
  const dayKey = dayKeyOf(now, s.startOfDayHour, off)
  return { id: uid(), key, routineId, ts: now, dayKey, tzOffsetMin: off, minuteOfDay: minuteOfDay(now, dayKey, off) }
}

function newActive(s: AppSettings, dhikrId: string, target: number, kind: SessionKind, now: number, count = 0, run?: RunState): ActiveSession {
  return { dhikrId, count: clamp(count), target: Math.max(1, target), startedAt: now, lastTapAt: now, activeMs: 0, paused: false, dayKey: dayOf(s, now), tzOffsetMin: tzOffsetMin(now), kind, run }
}

/** Saves the running counter (if any) into history and clears it. */
function flushActive(state: AppData, now: number, completed?: boolean): AppData {
  const a = state.active
  if (!a) return state
  if (a.run?.done || a.count <= 0) return { ...state, active: null }
  const done = completed ?? a.count >= a.target
  const session = makeSession(a, now, done, a.run?.routineId ?? null, a.run?.kind ?? a.kind)
  let unfinished = state.unfinished
  if (a.kind === 'free' && !a.run) {
    unfinished = !done ? { dhikrId: a.dhikrId, count: a.count, target: a.target, dayKey: a.dayKey } : unfinished?.dhikrId === a.dhikrId ? null : unfinished
  }
  return { ...state, sessions: [...state.sessions, session], unfinished, active: null }
}

function advanceRun(state: AppData, a: ActiveSession, now: number): AppData {
  const run = a.run!
  const finished = makeSession(a, now, a.count >= a.target, run.routineId, run.kind)
  const sessions = a.count > 0 ? [...state.sessions, finished] : state.sessions
  const nextIndex = run.index + 1
  if (nextIndex < run.items.length) {
    const it = run.items[nextIndex]
    return { ...state, sessions, active: { ...newActive(state.settings, it.dhikrId, it.count, a.kind, now, 0, { ...run, index: nextIndex }), activeMs: 0 } }
  }
  const completions = run.key ? [...state.completions, makeCompletion(run.key, run.routineId, now, state.settings)] : state.completions
  return {
    ...state, sessions, completions, lastFinishedRun: { key: run.key, name: run.name, ts: now },
    active: { ...a, count: 0, activeMs: 0, run: { ...run, done: true } },
  }
}

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'LOAD': return action.data
    case 'SET_SETTINGS': return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'SET_NOTIF': return { ...state, settings: { ...state.settings, notifications: { ...state.settings.notifications, ...action.patch } } }
    case 'SET_PRAYER': return { ...state, settings: { ...state.settings, prayerTimes: { ...state.settings.prayerTimes, ...action.patch } } }
    case 'SET_PROFILE': return { ...state, profile: { ...state.profile, ...action.patch } }
    case 'START_ACTIVE': {
      const flushed = flushActive(state, action.now)
      const unfinished = flushed.unfinished?.dhikrId === action.dhikrId && action.startCount ? null : flushed.unfinished
      return { ...flushed, unfinished, active: newActive(state.settings, action.dhikrId, action.target, action.kind ?? 'free', action.now, action.startCount ?? 0) }
    }
    case 'TAP': {
      const a = state.active
      if (!a || a.paused || a.run?.done) return state
      const gap = Math.max(0, action.now - a.lastTapAt)
      const next: ActiveSession = { ...a, count: clamp(a.count + 1), lastTapAt: action.now, activeMs: a.activeMs + Math.min(gap, IDLE_CAP_MS) }
      if (next.run && next.count >= next.target) return advanceRun(state, next, action.now)
      return { ...state, active: next }
    }
    case 'UNDO': return state.active && !state.active.run?.done ? { ...state, active: { ...state.active, count: clamp(state.active.count - 1) } } : state
    case 'RESET_ACTIVE': return state.active ? { ...state, active: { ...state.active, count: 0, activeMs: 0 } } : state
    case 'SET_TARGET': return state.active ? { ...state, active: { ...state.active, target: Math.max(1, action.target) } } : state
    case 'SET_PAUSED': return state.active ? { ...state, active: { ...state.active, paused: action.paused, lastTapAt: action.now } } : state
    case 'FINISH_ACTIVE': return flushActive(state, action.now, action.completed)
    case 'START_RUN': {
      const flushed = flushActive(state, action.now)
      const first = action.run.items[0]
      if (!first) return flushed
      const run: RunState = { ...action.run, index: 0, done: false }
      return { ...flushed, active: newActive(state.settings, first.dhikrId, first.count, action.run.kind, action.now, 0, run) }
    }
    case 'RUN_SKIP': return state.active?.run && !state.active.run.done ? advanceRun(state, state.active, action.now) : state
    case 'MARK_DONE': {
      const day = dayOf(state.settings, action.now)
      if (state.completions.some((c) => c.key === action.key && c.dayKey === day)) return state
      return { ...state, completions: [...state.completions, makeCompletion(action.key, null, action.now, state.settings)] }
    }
    case 'UNMARK': return { ...state, completions: state.completions.filter((c) => !(c.key === action.key && c.dayKey === action.dayKey)) }
    case 'ROLLOVER': {
      const a = state.active
      if (!a || a.dayKey === dayOf(state.settings, action.now)) return state
      return flushActive(state, a.lastTapAt)
    }
    case 'TOGGLE_FAV': return { ...state, favorites: state.favorites.includes(action.id) ? state.favorites.filter((f) => f !== action.id) : [...state.favorites, action.id] }
    case 'SAVE_CUSTOM': {
      const exists = state.customDhikr.some((d) => d.id === action.dhikr.id)
      return { ...state, customDhikr: exists ? state.customDhikr.map((d) => (d.id === action.dhikr.id ? action.dhikr : d)) : [...state.customDhikr, action.dhikr] }
    }
    case 'DELETE_CUSTOM': return { ...state, customDhikr: state.customDhikr.filter((d) => d.id !== action.id), favorites: state.favorites.filter((f) => f !== action.id) }
    case 'SAVE_ROUTINE': {
      const exists = state.routines.some((r) => r.id === action.routine.id)
      return { ...state, routines: exists ? state.routines.map((r) => (r.id === action.routine.id ? action.routine : r)) : [...state.routines, action.routine] }
    }
    case 'DELETE_ROUTINE': return { ...state, routines: state.routines.filter((r) => r.id !== action.id) }
    case 'ADD_MOOD': return { ...state, moods: [...state.moods, action.entry].slice(-500) }
    case 'NOTIF_SENT': {
      const cutoff = addDays(action.event.dayKey, -LOG_KEEP_DAYS)
      return { ...state, notificationLog: [...state.notificationLog.filter((e) => e.dayKey >= cutoff), action.event] }
    }
    case 'NOTIF_RECONCILE': return { ...state, notificationLog: action.log, ignoredByKind: action.ignoredByKind }
    case 'OPENED': return { ...state, lastOpenedAt: action.now }
    case 'RESET_HISTORY': return { ...state, sessions: [], completions: [], moods: [], notificationLog: [], ignoredByKind: {}, unfinished: null, active: null, lastFinishedRun: null, lastOpenedAt: action.now }
    case 'DELETE_ALL': return createDefaultData(action.now)
    default: return state
  }
}
