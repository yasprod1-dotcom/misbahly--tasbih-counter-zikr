import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { MIN_CHOICES } from '@/domain/constants'
import { formatDuration } from '@/domain/dates'
import { buildTimedSession, estimateSeconds } from '@/domain/sessionPlanner'
import { useActions } from '@/hooks/useActions'
import { useDerived } from '@/hooks/useDerived'
import { cn } from '@/lib/utils'

/** "I have N minutes": builds a short session from preferences, time of day and history. */
export function TimedSessionSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, byId } = useDerived()
  const { startRun } = useActions()
  const { t } = useTranslation()
  const [minutes, setMinutes] = useState(5)
  useEffect(() => { if (open) setMinutes(MIN_CHOICES.includes(data.profile.dailyMinutes) && data.profile.dailyMinutes > 1 ? data.profile.dailyMinutes : 5) }, [open, data.profile.dailyMinutes])
  const items = useMemo(() => (open ? buildTimedSession(data, minutes, new Date().getHours()) : []), [open, data, minutes])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-md overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{t('Here is your {{m}}-minute dhikr', { m: minutes })}</SheetTitle>
          <SheetDescription>{t("Shaped by the time of day, your routines and what you use most.")}</SheetDescription>
        </SheetHeader>
        <div className="my-4 flex gap-2">
          {MIN_CHOICES.filter((m) => m > 1).map((m) => (
            <button key={m} onClick={() => setMinutes(m)} className={cn('flex-1 rounded-full border py-2 text-sm', m === minutes ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>{m} {t("min")}</button>
          ))}
        </div>
        <ul className="mb-4">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between border-b border-border/50 py-2.5">
              <span className="font-medium">{t(byId.get(i.dhikrId)?.title)}</span>
              <span className="text-sm text-muted-foreground">{i.count}×</span>
            </li>
          ))}
        </ul>
        <p className="mb-3 text-sm text-muted-foreground">{t('About {{time}}', { time: formatDuration(estimateSeconds(items)) })}</p>
        <Button size="lg" className="w-full" onClick={() => { onOpenChange(false); startRun(t('Your {{m}}-minute dhikr', { m: minutes }), items, { kind: 'five' }) }}>{t("Start")}</Button>
      </SheetContent>
    </Sheet>
  )
}
