import {
  GOAL_REMINDER_TIME, IGNORED_PAUSE_AT, IGNORED_REDUCE_AT, IGNORE_AFTER_MS, MAX_NOTIFS_PER_DAY, RESCUE_AFTER_DAYS,
  RESCUE_MAX_DAYS, RESCUE_TIME, STALE_NOTIF_MS, STREAK_REMINDER_MIN_DAYS, STREAK_REMINDER_TIME, WEEKLY_REFLECTION,
} from './constants'
import { diffDays, dayKeyOf, hhmmToMinutes, timeOnDay, tzOffsetMin, weekdayOf } from './dates'
import { todaysPrayerTimes } from './prayer'
import { analyzeHabitPattern, completedOn } from './habits'
import { activeDaySet, computeStreak, getDayProgress } from './stats'
import type { AppData, NotifKind, NotificationEvent, RoutineKey } from './types'

export interface PlannedNotification {
  id: string
  kind: NotifKind
  routineKey: RoutineKey | null
  fireAt: number
  /** Lower number = more important. */
  priority: number
  copyKey: string
  params: Record<string, string | number>
}

const PRIORITY: Record<NotifKind, number> = { rescue: 0, missed: 1, streak: 2, suhoor: 2, iftar: 2, reminder: 3, goal: 4, weekly: 5 }

/** Adaptive frequency: ignored reminders gradually become rarer, then pause. */
function allowedByAdaptivity(data: AppData, kind: NotifKind, today: string): boolean {
  const ignored = data.ignoredByKind[kind] ?? 0
  if (ignored >= IGNORED_PAUSE_AT) return false
  if (ignored >= IGNORED_REDUCE_AT) return diffDays(today, '2000-01-01') % 2 === 0
  return true
}

/** Marks old unanswered notifications as ignored / answered ones as acted. Pure. */
export function reconcileLog(data: AppData, now: number): { log: NotificationEvent[]; ignoredByKind: Record<string, number>; changed: boolean } {
  const ignoredByKind = { ...data.ignoredByKind }
  let changed = false
  const log = data.notificationLog.map((e) => {
    if (e.status !== 'sent') return e
    const answered = e.routineKey
      ? data.completions.some((c) => c.key === e.routineKey && c.dayKey === e.dayKey)
      : data.sessions.some((s) => s.startedAt >= e.sentAt && s.startedAt < e.sentAt + IGNORE_AFTER_MS)
    if (answered) { changed = true; ignoredByKind[e.kind] = 0; return { ...e, status: 'acted' as const } }
    if (now - e.sentAt > IGNORE_AFTER_MS) { changed = true; ignoredByKind[e.kind] = (ignoredByKind[e.kind] ?? 0) + 1; return { ...e, status: 'ignored' as const } }
    return e
  })
  return { log, ignoredByKind, changed }
}

export function planNotifications(data: AppData, now: number): PlannedNotification[] {
  const pref = data.settings.notifications
  if (!pref.enabled) return []
  const startHour = data.settings.startOfDayHour
  const off = tzOffsetMin(now)
  const today = dayKeyOf(now, startHour, off)
  const at = (hhmm: string) => timeOnDay(today, hhmm, off)
  const yesterday = dayKeyOf(now - 86_400_000, startHour, off)
  const cands: PlannedNotification[] = []
  const add = (kind: NotifKind, fireAt: number, copyKey: string, key: RoutineKey | null = null, params: PlannedNotification['params'] = {}, idSuffix = '') =>
    cands.push({ id: `${today}:${kind}:${key ?? copyKey}${idSuffix}`, kind, routineKey: key, fireAt, priority: PRIORITY[kind], copyKey, params })

  const slots = [['morning', pref.morning], ['evening', pref.evening], ['sleep', pref.sleep]] as const
  const fixedAt: Partial<Record<RoutineKey, number>> = {}
  for (const [key, cfg] of slots) {
    if (cfg.on && !completedOn(data.completions, key, today)) {
      fixedAt[key] = at(cfg.time)
      add('reminder', at(cfg.time), `reminder_${key}`, key)
    }
    if (!pref.missed || completedOn(data.completions, key, today)) continue
    const pattern = analyzeHabitPattern(data.completions, key, today)
    if (pattern.preferredMinute == null) continue
    const fireAt = at('00:00') + (pattern.preferredMinute + pref.toleranceMin) * 60_000
    if (fixedAt[key] != null && Math.abs(fixedAt[key]! - fireAt) < 45 * 60_000) continue
    add('missed', fireAt, completedOn(data.completions, key, yesterday) ? 'missed_yesterday' : 'missed_usual', key)
  }

  const progress = getDayProgress(data, today)
  const days = activeDaySet(data)
  const streak = computeStreak(days, today)
  if (pref.streak && streak.current >= STREAK_REMINDER_MIN_DAYS && progress.total === 0) add('streak', at(STREAK_REMINDER_TIME), 'streak', null, { n: streak.current })
  if (pref.goal && progress.total > 0 && progress.total < data.settings.dailyGoal) add('goal', at(GOAL_REMINDER_TIME), 'goal', null, { done: progress.total, goal: data.settings.dailyGoal })
  if (pref.weekly && weekdayOf(today) === WEEKLY_REFLECTION.weekday) add('weekly', at(WEEKLY_REFLECTION.time), 'weekly')
  if (pref.rescue && data.profile.onboarded && streak.lastActiveDayKey) {
    const gap = diffDays(today, streak.lastActiveDayKey)
    if (gap >= RESCUE_AFTER_DAYS && gap <= RESCUE_MAX_DAYS && gap % RESCUE_AFTER_DAYS === 0) add('rescue', at(RESCUE_TIME), 'rescue')
  }
  const ram = data.settings.ramadan
  if (ram.enabled) {
    add('suhoor', at(ram.suhoorTime), 'suhoor')
    add('iftar', at(ram.iftarTime), 'iftar')
  }
  // Custom dhikr with their own daily reminder time (skipped once counted today).
  for (const d of data.customDhikr) {
    if (!d.reminderTime || data.sessions.some((s) => s.dayKey === today && s.dhikrId === d.id)) continue
    add('reminder', at(d.reminderTime), 'reminder_custom', null, { name: d.title }, `:${d.id}`)
  }

  // After-prayer reminders follow the real prayer times (only when the user opted in and times are loaded).
  const pt = data.settings.prayerTimes
  const prayerTimes = todaysPrayerTimes(pt, today)
  if (prayerTimes) {
    for (const p of pt.remind) {
      if (completedOn(data.completions, p, today)) continue
      add('reminder', at('00:00') + (hhmmToMinutes(prayerTimes[p]) + pt.remindAfterMin) * 60_000, 'reminder_prayer', p)
    }
  }

  const sentToday = data.notificationLog.filter((e) => e.dayKey === today && e.status !== 'cancelled')
  const sentIds = new Set(data.notificationLog.map((e) => e.id))
  const cap = Math.max(0, Math.min(pref.maxPerDay, MAX_NOTIFS_PER_DAY) - sentToday.length)
  return cands
    .filter((c) => !sentIds.has(c.id) && allowedByAdaptivity(data, c.kind, today))
    .sort((a, b) => a.priority - b.priority || a.fireAt - b.fireAt)
    .slice(0, cap)
    .sort((a, b) => a.fireAt - b.fireAt)
}

/** Planned notifications that should fire right now (not stale). */
export const dueNow = (plans: PlannedNotification[], now: number): PlannedNotification[] =>
  plans.filter((p) => p.fireAt <= now && now - p.fireAt <= STALE_NOTIF_MS)
