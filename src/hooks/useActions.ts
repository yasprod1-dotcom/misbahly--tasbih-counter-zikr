import { useNavigate } from 'react-router-dom'
import { ONE_MINUTE_SEC } from '@/domain/constants'
import { suggestOneMinute, catchUpItems } from '@/domain/sessionPlanner'
import type { DhikrRoutine, PrayerId, RoutineItem, RoutineKey, SessionKind } from '@/domain/types'
import { useStore } from '@/store/AppStore'

/** One place for "start something" flows, so every screen starts sessions the same way. */
export function useActions() {
  const { data, dispatch } = useStore()
  const nav = useNavigate()

  const startRun = (name: string, items: RoutineItem[], opts: { routineId?: string | null; key?: RoutineKey | null; kind?: SessionKind } = {}) => {
    if (!items.length) return
    dispatch({ type: 'START_RUN', now: Date.now(), run: { routineId: opts.routineId ?? null, name, key: opts.key ?? null, items, kind: opts.kind ?? 'routine' } })
    nav('/run')
  }
  const startRoutine = (r: DhikrRoutine, prayer?: PrayerId) =>
    startRun(r.name, r.items, { routineId: r.id, key: prayer ?? (r.slot && r.slot !== 'afterPrayer' ? (r.slot as RoutineKey) : null) })
  const startCatchUp = (r: DhikrRoutine, key?: RoutineKey) => startRun(r.name, catchUpItems(r), { routineId: r.id, key: key ?? (r.slot as RoutineKey | null), kind: 'catchUp' })
  const startFree = (dhikrId: string, target: number) => {
    dispatch({ type: 'START_ACTIVE', dhikrId, target, now: Date.now() })
    nav('/tasbih')
  }
  const startOneMinute = () => nav('/one-minute')
  const oneMinuteDhikr = () => suggestOneMinute(data)
  return { startRun, startRoutine, startCatchUp, startFree, startOneMinute, oneMinuteDhikr, ONE_MINUTE_SEC }
}
