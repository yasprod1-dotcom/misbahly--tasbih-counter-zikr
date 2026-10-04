import { ArrowRight, Check, Circle, Clock, HeartHandshake, Moon, Sparkles, Timer, Wind } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ProgressRing, Card } from '@/components/app/primitives'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FRIDAY_ACTIONS, KEY_LABELS } from '@/data/content'
import { diffDays, minutesToHhmm } from '@/domain/dates'
import { completedOn } from '@/domain/habits'
import { usePrayerToday } from '@/hooks/usePrayerToday'
import type { RoutineKey } from '@/domain/types'
import { useActions } from '@/hooks/useActions'
import { useDerived } from '@/hooks/useDerived'
import { useStore } from '@/store/AppStore'
import { PRAYERS } from '@/domain/constants'
import { cn } from '@/lib/utils'

export function ProgressCard() {
  const { progress, streak, data } = useDerived()
  const { t } = useTranslation()
  const nav = useNavigate()
  return (
    <div className="px-5 py-2">
      <Card className="flex flex-col items-center gap-4 py-6">
        <ProgressRing value={progress.total / Math.max(1, data.settings.dailyGoal)} size={188} stroke={11}>
          <span className="font-display text-5xl font-bold tabular-nums">{progress.total}</span>
          <span className="text-sm text-muted-foreground">/ {data.settings.dailyGoal}</span>
        </ProgressRing>
        <div className="text-center">
          <p className="text-sm font-medium">{t("Today's dhikr")}</p>
          {streak.current > 0 && <p className="mt-0.5 text-xs text-gold">{t('{{n}} days of consistency', { n: streak.current })}</p>}
          {progress.total === 0 && <p className="mt-0.5 text-xs text-muted-foreground">{t("Your first remembrance of the day can start now.")}</p>}
        </div>
        <Button size="lg" className="w-full max-w-xs" onClick={() => nav('/tasbih')}>{progress.total > 0 ? t("Continue") : t("Start Tasbih")}</Button>
      </Card>
    </div>
  )
}

export function MissedCards({ now }: { now: number }) {
  const { data, patterns, missed, yesterdayDone, routineFor, streak, today } = useDerived()
  const { dispatch } = useStore()
  const { startRoutine, startCatchUp, startOneMinute } = useActions()
  const { t } = useTranslation()
  const nav = useNavigate()
  const cards: React.ReactNode[] = []
  const late = missed(now)[0] as 'morning' | 'evening' | 'sleep' | undefined
  const routine = late ? routineFor(late) : null

  if (late && routine) {
    const usual = patterns[late].preferredMinute
    cards.push(
      <Card key="missed" className="border-gold/40 bg-accent/40">
        <div className="mb-1 flex items-center gap-2 text-gold"><Wind className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wider">{t("A gentle nudge")}</span></div>
        <p className="text-sm">
          {yesterdayDone(late)
            ? t('Yesterday you completed your {{name}}. Your routine is waiting for you today.', { name: KEY_LABELS[late] })
            : t('You usually do your {{name}} around {{time}}. You haven\'t completed it today. Take a moment for your dhikr.', { name: KEY_LABELS[late], time: usual != null ? minutesToHhmm(usual) : '' })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => startRoutine(routine)}>{t("Start routine")}</Button>
          <Button size="sm" variant="outline" onClick={() => startCatchUp(routine, late as RoutineKey)}>{t("A lighter version")}</Button>
        </div>
      </Card>,
    )
  }
  if (data.unfinished && data.unfinished.count > 0 && data.unfinished.count < data.unfinished.target) {
    const u = data.unfinished
    cards.push(
      <Card key="unfinished" className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("Continue where you stopped")}</p>
          <p className="truncate text-xs text-muted-foreground">{u.count} / {u.target}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => { dispatch({ type: 'START_ACTIVE', dhikrId: u.dhikrId, target: u.target, startCount: u.count, now: Date.now() }); nav('/tasbih') }}>{t("Continue")}</Button>
      </Card>,
    )
  }
  const gap = streak.lastActiveDayKey ? diffDays(today, streak.lastActiveDayKey) : 0
  if (streak.lastActiveDayKey && gap >= 2) {
    cards.push(
      <Card key="rescue" className="flex items-center justify-between gap-3">
        <p className="text-sm">{t("Let's start again. Just one minute.")}</p>
        <Button size="sm" onClick={startOneMinute}>{t("Begin")}</Button>
      </Card>,
    )
  } else if (streak.current === 0 && streak.longest >= 3 && gap === 1) {
    cards.push(<p key="restart" className="px-1 text-center text-sm text-muted-foreground">{t("Yesterday was yesterday. Begin again today.")}</p>)
  }
  return cards.length ? <div className="space-y-3 px-5 py-2">{cards}</div> : null
}

/** Shown for a while after a real prayer time passes, when its dhikr isn't done yet. */
export function PrayerNudge() {
  const { times, state } = usePrayerToday()
  const { data, today, routineFor } = useDerived()
  const { startRoutine } = useActions()
  const { t } = useTranslation()
  const nav = useNavigate()
  const latest = state?.latest
  const routine = routineFor('afterPrayer')
  if (!times || !latest || !routine || state.minutesSinceLatest == null || state.minutesSinceLatest > 90) return null
  if (completedOn(data.completions, latest, today)) return null
  return (
    <div className="px-5 py-2">
      <Card className="border-gold/40 bg-accent/40">
        <div className="mb-1 flex items-center gap-2 text-gold"><Clock className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wider">{t(KEY_LABELS[latest])} · {times[latest]}</span></div>
        <p className="text-sm">{t("Take a moment for dhikr after prayer.")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => startRoutine(routine, latest)}>{t("Start")}</Button>
          <Button size="sm" variant="outline" onClick={() => nav('/prayer')}>{t("After prayer")}</Button>
        </div>
      </Card>
    </div>
  )
}

export function QuickActions({ onFive }: { onFive: () => void }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const items = [
    { label: '1 minute', icon: <Timer className="h-5 w-5" />, go: () => nav('/one-minute') },
    { label: 'I have 5 minutes', icon: <Sparkles className="h-5 w-5" />, go: onFive },
    { label: 'Quiet moment', icon: <Moon className="h-5 w-5" />, go: () => nav('/quiet') },
    { label: 'How do I feel?', icon: <HeartHandshake className="h-5 w-5" />, go: () => nav('/mood') },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 px-5 py-2">
      {items.map((i) => (
        <button key={i.label} onClick={i.go} className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 text-start text-sm font-medium transition-colors hover:bg-accent/50 active:scale-[0.98]">
          <span className="text-primary">{i.icon}</span>{t(i.label)}
        </button>
      ))}
    </div>
  )
}

function Row({ title, status, sub, onClick }: { title: string; status: 'done' | 'partial' | 'none'; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 border-b border-border/60 py-4 text-start transition-colors hover:text-primary">
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border', status === 'done' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground')}>
        {status === 'done' ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{sub}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
    </button>
  )
}

export function JourneyList() {
  const { slotStatus, routineFor, prayersDone, chain } = useDerived()
  const { times, state } = usePrayerToday()
  const { startRoutine } = useActions()
  const { t } = useTranslation()
  const nav = useNavigate()
  const slot = (key: 'morning' | 'evening' | 'sleep') => {
    const c = chain(key)
    const done = slotStatus(key) === 'done'
    return <Row key={key} title={t(KEY_LABELS[key])} status={slotStatus(key)} sub={done ? (c > 1 ? t('Completed · {{n}} days in a row', { n: c }) : t('Completed')) : t('Not started')} onClick={() => { const r = routineFor(key); if (r) startRoutine(r); else nav('/routines') }} />
  }
  return (
    <section className="px-5 py-3">
      <h2 className="mb-1 text-xl">{t("Today's journey")}</h2>
      {slot('morning')}
      <Row title={t("After prayer")} status={prayersDone === PRAYERS.length ? 'done' : prayersDone > 0 ? 'partial' : 'none'} sub={times && state?.next && prayersDone < PRAYERS.length ? t('{{n}} / {{total}} completed · next {{name}} {{time}}', { n: prayersDone, total: PRAYERS.length, name: t(KEY_LABELS[state.next]), time: times[state.next] }) : t('{{n}} / {{total}} completed', { n: prayersDone, total: PRAYERS.length })} onClick={() => nav('/prayer')} />
      {slot('evening')}
      {slot('sleep')}
    </section>
  )
}

export function FridayCard() {
  const { t } = useTranslation()
  const { data, today, routineFor } = useDerived()
  const { startRoutine, startFree } = useActions()
  const done = data.sessions.filter((s) => s.dayKey === today && s.dhikrId.startsWith('salawat')).reduce((a, s) => a + s.count, 0)
    + (data.active && data.active.dayKey === today && data.active.dhikrId.startsWith('salawat') ? data.active.count : 0)
  const goal = data.settings.fridaySalawatGoal
  const routine = routineFor('friday')
  return (
    <div className="px-5 py-2">
      <Card className="border-gold/40">
        <h2 className="text-xl">{t("Friday Dhikr")}</h2>
        <p className="mb-3 text-xs text-muted-foreground">{t("Salawat today:")} {done} / {goal}</p>
        <Progress value={Math.min(100, (done / goal) * 100)} className="mb-4 h-2" />
        <ul className="mb-4 space-y-1.5 text-sm">
          {FRIDAY_ACTIONS.map((a) => <li key={a.id} className="flex gap-2"><span className="text-gold">•</span>{t(a.text)}</li>)}
        </ul>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => startFree('salawat', goal)}>{t("Count salawat")}</Button>
          {routine && <Button size="sm" variant="outline" onClick={() => startRoutine(routine)}>{t("Friday routine")}</Button>}
        </div>
      </Card>
    </div>
  )
}

export function RamadanCard() {
  const { t } = useTranslation()
  const { data, progress } = useDerived()
  const { startFree } = useActions()
  const r = data.settings.ramadan
  return (
    <div className="px-5 py-2">
      <Card className="border-gold/40">
        <h2 className="text-xl">{t("Ramadan Dhikr")}</h2>
        <p className="mb-3 text-xs text-muted-foreground">{t("Suhoor")} {r.suhoorTime} {t("· Iftar")} {r.iftarTime}</p>
        <Progress value={Math.min(100, (progress.total / r.nightGoal) * 100)} className="mb-3 h-2" />
        <p className="mb-3 text-sm text-muted-foreground">{progress.total} / {r.nightGoal}</p>
        <Button size="sm" onClick={() => startFree('afuw', 10)}>{t("Night dhikr")}</Button>
      </Card>
    </div>
  )
}
