import i18n from '@/lib/i18n'
import { KEY_LABELS } from '@/data/content'
import { NOTIF_COPY, NOTIF_TITLE } from '@/data/notificationCopy'
import { TICK_MS } from '@/domain/constants'
import { dayKeyOf } from '@/domain/dates'
import { analyzeHabitPattern } from '@/domain/habits'
import { dueNow, planNotifications, reconcileLog, type PlannedNotification } from '@/domain/notificationPlanner'
import type { AppData, NotificationEvent, NotifKind, RoutineKey } from '@/domain/types'
import type { Action } from '@/store/reducer'

/**
 * Notification service (web). Honest limits: browsers can only show a
 * notification while the app (or its installed PWA) is running. A push backend
 * later can deliver the same planned notifications when the app is closed.
 * The planner (domain/notificationPlanner) decides WHAT and WHEN; this file
 * only delivers.
 */
export const notificationsSupported = (): boolean => typeof window !== 'undefined' && 'Notification' in window
export const permissionState = (): NotificationPermission | 'unsupported' => (notificationsSupported() ? Notification.permission : 'unsupported')

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  try { return await Notification.requestPermission() } catch { return Notification.permission }
}

export function messageFor(plan: PlannedNotification, now: number): string {
  const variants = NOTIF_COPY[plan.copyKey] ?? NOTIF_COPY.missed_usual
  const pick = variants[Math.abs(Math.floor(now / 86_400_000)) % variants.length]
  const params = plan.copyKey === 'reminder_prayer' && plan.routineKey ? { ...plan.params, name: i18n.t(KEY_LABELS[plan.routineKey]) } : plan.params
  return i18n.t(pick, params)
}

async function show(plan: PlannedNotification, now: number): Promise<boolean> {
  if (permissionState() !== 'granted') return false
  const body = messageFor(plan, now)
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
    if (reg) await reg.showNotification(NOTIF_TITLE, { body, tag: plan.routineKey ?? plan.kind, icon: '/icon.svg', data: { url: '/' } })
    else new Notification(NOTIF_TITLE, { body, tag: plan.routineKey ?? plan.kind, icon: '/icon.svg' })
    return true
  } catch {
    return false
  }
}

/** Removes a delivered notification from the tray once its routine is done. */
export async function cancelNotification(tag: string): Promise<void> {
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
    const list = (await reg?.getNotifications({ tag })) ?? []
    list.forEach((n) => n.close())
  } catch { /* ignore */ }
}

// ── Named scheduling API ─────────────────────────────────────────────────────
export const rescheduleNotifications = (data: AppData, now = Date.now()): PlannedNotification[] => planNotifications(data, now)
const only = (data: AppData, kind: NotifKind, key?: RoutineKey, now = Date.now()) =>
  rescheduleNotifications(data, now).filter((p) => p.kind === kind && (!key || p.routineKey === key))
export const scheduleMorningReminder = (d: AppData, n?: number) => only(d, 'reminder', 'morning', n)
export const scheduleEveningReminder = (d: AppData, n?: number) => only(d, 'reminder', 'evening', n)
export const scheduleMissedDhikrReminder = (d: AppData, n?: number) => only(d, 'missed', undefined, n)
export const scheduleGoalReminder = (d: AppData, n?: number) => only(d, 'goal', undefined, n)
export const scheduleStreakReminder = (d: AppData, n?: number) => only(d, 'streak', undefined, n)
export { analyzeHabitPattern }

/** Runs the engine: reconcile history, deliver anything due. Returns nothing; reports via dispatch. */
export async function runEngineTick(data: AppData, dispatch: (a: Action) => void, now = Date.now()) {
  const rec = reconcileLog(data, now)
  if (rec.changed) dispatch({ type: 'NOTIF_RECONCILE', log: rec.log, ignoredByKind: rec.ignoredByKind })
  const plans = dueNow(planNotifications({ ...data, notificationLog: rec.log, ignoredByKind: rec.ignoredByKind }, now), now)
  for (const p of plans) {
    if (!(await show(p, now))) continue
    const event: NotificationEvent = { id: p.id, kind: p.kind, routineKey: p.routineKey, sentAt: now, dayKey: dayKeyOf(now, data.settings.startOfDayHour), status: 'sent' }
    dispatch({ type: 'NOTIF_SENT', event })
    break // one at a time, so two reminders never arrive together
  }
}

export function startNotificationEngine(getData: () => AppData, dispatch: (a: Action) => void): () => void {
  const tick = () => { void runEngineTick(getData(), dispatch) }
  tick()
  const id = window.setInterval(tick, TICK_MS)
  const onVisible = () => { if (document.visibilityState === 'visible') tick() }
  document.addEventListener('visibilitychange', onVisible)
  return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
}
