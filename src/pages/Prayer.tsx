import { Check, Clock, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHeader } from '@/components/app/primitives'
import { Button } from '@/components/ui/button'
import { KEY_LABELS } from '@/data/content'
import { PRAYERS } from '@/domain/constants'
import { completedOn } from '@/domain/habits'
import { useActions } from '@/hooks/useActions'
import { useDerived } from '@/hooks/useDerived'
import { usePrayerToday } from '@/hooks/usePrayerToday'
import { useStore } from '@/store/AppStore'
import { cn } from '@/lib/utils'

export default function Prayer() {
  const { data, today, routineFor } = useDerived()
  const { dispatch } = useStore()
  const { startRoutine } = useActions()
  const { t } = useTranslation()
  const nav = useNavigate()
  const { times, state, enabled, failed } = usePrayerToday()
  const routine = routineFor('afterPrayer')
  return (
    <div>
      <PageHeader back title={t("After prayer")} subtitle={t("Take a moment for dhikr after each prayer.")} />
      {!enabled && (
        <div className="px-5 pb-3">
          <Card className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("Follow real prayer times")}</p>
              <p className="text-xs text-muted-foreground">{t("Optional. See today's times and get a gentle reminder after prayer.")}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => nav('/settings')}>{t("Set up")}</Button>
          </Card>
        </div>
      )}
      {enabled && !times && (
        <p className="px-5 pb-3 text-xs text-muted-foreground">{failed ? t("Couldn't load prayer times. They'll load again when you're back online.") : t("Loading today's prayer times…")}</p>
      )}
      <ul className="px-5">
        {PRAYERS.map((p) => {
          const done = completedOn(data.completions, p, today)
          return (
            <li key={p} className="flex items-center gap-3 border-b border-border/60 py-4">
              <button
                aria-label={done ? t('Mark {{name}} dhikr as not done', { name: t(KEY_LABELS[p]) }) : t('Mark {{name}} dhikr as done', { name: t(KEY_LABELS[p]) })}
                onClick={() => dispatch(done ? { type: 'UNMARK', key: p, dayKey: today } : { type: 'MARK_DONE', key: p, now: Date.now() })}
                className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors', done ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground')}
              ><Check className="h-5 w-5" /></button>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2 font-semibold">{t(KEY_LABELS[p])}{times && <span className="text-sm font-normal tabular-nums text-muted-foreground"><Clock className="me-1 inline h-3.5 w-3.5 align-[-2px]" />{times[p]}</span>}{state?.next === p && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">{t("Next")}</span>}</p>
                <p className="text-xs text-muted-foreground">{done ? t("Dhikr completed") : times && state?.passed.includes(p) ? t("Time has come. Take a moment for dhikr.") : t("Take a moment for dhikr.")}</p>
              </div>
              {routine && <Button size="sm" variant={done ? 'ghost' : 'outline'} onClick={() => startRoutine(routine, p)}><Play className="me-1.5 h-3.5 w-3.5 rtl:rotate-180" />{t("Start")}</Button>}
            </li>
          )
        })}
      </ul>
      <p className="px-5 pt-5 text-xs text-muted-foreground">{enabled ? t("Times come from your saved location and are kept on this device. You can always mark each prayer yourself.") : t("Prayer times are not required — mark each prayer when you pray.")}</p>
    </div>
  )
}
