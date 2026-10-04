import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react'
import i18n from '@/lib/i18n'
import { PERSIST_DEBOUNCE_MS } from '@/domain/constants'
import { dayKeyOf } from '@/domain/dates'
import type { AppData } from '@/domain/types'
import { prayerSig } from '@/domain/prayer'
import { cancelNotification, startNotificationEngine } from '@/services/notifications'
import { fetchPrayerTimes } from '@/services/prayerTimes'
import { loadData, saveData } from '@/storage/storage'
import { reducer, type Action } from './reducer'

interface Ctx { data: AppData; dispatch: Dispatch<Action>; today: string; saveFailed: boolean }
const StoreContext = createContext<Ctx | null>(null)

export function useStore(): Ctx {
  const c = useContext(StoreContext)
  if (!c) throw new Error('Store missing')
  return c
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, () => loadData())
  const [saveFailed, setSaveFailed] = useState(false)
  const [clock, setClock] = useState(() => Date.now())
  const ref = useRef(data)
  ref.current = data
  const startHour = data.settings.startOfDayHour
  const today = useMemo(() => dayKeyOf(clock, startHour), [clock, startHour])

  // Persist asynchronously (taps never wait on storage); flush when the page hides.
  useEffect(() => {
    const t = window.setTimeout(() => setSaveFailed(!saveData(data)), PERSIST_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [data])
  useEffect(() => {
    const flush = () => { saveData(ref.current) }
    const onHide = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onHide) }
  }, [])

  // Clock: catches midnight and timezone changes (the day key is recomputed from the live offset).
  useEffect(() => {
    const update = () => setClock(Date.now())
    const id = window.setInterval(update, 15_000)
    document.addEventListener('visibilitychange', update)
    window.addEventListener('focus', update)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', update); window.removeEventListener('focus', update) }
  }, [])
  useEffect(() => { dispatch({ type: 'ROLLOVER', now: Date.now() }) }, [today])
  useEffect(() => { dispatch({ type: 'OPENED', now: Date.now() }) }, [])

  // Theme + accessibility switches.
  const { theme, largeText, highContrast, reduceMotion, language } = data.settings
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.toggle('dark', dark)
    }
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('large-text', largeText)
    root.classList.toggle('hc', highContrast)
    root.classList.toggle('reduce-motion', reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [largeText, highContrast, reduceMotion])
  useEffect(() => {
    if (data.profile.onboarded && i18n.language !== language) void i18n.changeLanguage(language)
  }, [language, data.profile.onboarded])

  // Opt-in prayer times: download today's times once per day (cached so they work offline), retry when back online.
  const pt = data.settings.prayerTimes
  const [ptRetry, setPtRetry] = useState(0)
  useEffect(() => {
    const bump = () => setPtRetry((n) => n + 1)
    const onVisible = () => { if (document.visibilityState === 'visible') bump() }
    window.addEventListener('online', bump)
    document.addEventListener('visibilitychange', onVisible)
    return () => { window.removeEventListener('online', bump); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
  useEffect(() => {
    if (!pt.enabled || pt.lat == null || pt.lng == null) return
    const sig = prayerSig(pt)
    if (pt.times && pt.times.dayKey === today && pt.times.sig === sig) return
    let cancelled = false
    void fetchPrayerTimes(today, { lat: pt.lat, lng: pt.lng, method: pt.method }).then((values) => {
      if (cancelled) return
      dispatch({ type: 'SET_PRAYER', patch: values ? { times: { dayKey: today, sig, values }, failed: false } : { failed: true } })
    })
    return () => { cancelled = true }
  }, [pt.enabled, pt.lat, pt.lng, pt.method, pt.times?.dayKey, pt.times?.sig, today, ptRetry])

  // Notification engine + tray cleanup when a routine gets completed.
  useEffect(() => startNotificationEngine(() => ref.current, dispatch), [])
  const lastCompletion = data.completions[data.completions.length - 1]
  useEffect(() => { if (lastCompletion) void cancelNotification(lastCompletion.key) }, [lastCompletion?.id])

  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  }, [])

  const value = useMemo(() => ({ data, dispatch, today, saveFailed }), [data, today, saveFailed])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
