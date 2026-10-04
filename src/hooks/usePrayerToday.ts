import { useEffect, useState } from 'react'
import { minuteOfDay, tzOffsetMin } from '@/domain/dates'
import { prayerState, todaysPrayerTimes } from '@/domain/prayer'
import { useStore } from '@/store/AppStore'

/** Today's prayer times (when the user opted in and they are loaded) and where "now" sits among them. */
export function usePrayerToday() {
  const { data, today } = useStore()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  const settings = data.settings.prayerTimes
  const times = todaysPrayerTimes(settings, today)
  const state = times ? prayerState(times, minuteOfDay(now, today, tzOffsetMin(now))) : null
  return { times, state, enabled: settings.enabled, failed: settings.failed, hasLocation: settings.lat != null && settings.lng != null }
}
