import { useState } from 'react'
import { PageHeader, Card, ArabicText } from '@/components/app/primitives'
import { Button } from '@/components/ui/button'
import { MOODS } from '@/data/content'
import { uid, dayKeyOf } from '@/domain/dates'
import type { MoodId } from '@/domain/types'
import { useActions } from '@/hooks/useActions'
import { useDerived } from '@/hooks/useDerived'
import { useStore } from '@/store/AppStore'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export default function Mood() {
  const { t } = useTranslation()
  const { data, dispatch } = useStore()
  const { byId } = useDerived()
  const { startFree } = useActions()
  const [mood, setMood] = useState<MoodId | null>(null)
  const current = MOODS.find((m) => m.id === mood)

  const choose = (id: MoodId) => {
    setMood(id)
    const first = MOODS.find((m) => m.id === id)?.dhikr[0] ?? null
    const now = Date.now()
    dispatch({ type: 'ADD_MOOD', entry: { id: uid(), mood: id, ts: now, dayKey: dayKeyOf(now, data.settings.startOfDayHour), suggestedDhikrId: first } })
  }

  return (
    <div>
      <PageHeader back title={t("How are you feeling?")} subtitle={t("A gentle, reflective suggestion — not medical advice.")} />
      <div className="grid grid-cols-2 gap-3 px-5 py-2">
        {MOODS.map((m) => (
          <button key={m.id} onClick={() => choose(m.id)} className={cn('flex min-h-[72px] items-center gap-3 rounded-2xl border px-4 text-start transition-colors', mood === m.id ? 'border-primary bg-accent' : 'border-border bg-card hover:bg-muted')}>
            <span className="text-2xl" aria-hidden>{m.emoji}</span>
            <span className="font-medium">{t(m.label)}</span>
          </button>
        ))}
      </div>
      {current && (
        <div className="space-y-3 px-5 py-5">
          <h2 className="text-xl">{t("For this moment")}</h2>
          {current.dhikr.map((id) => {
            const d = byId.get(id)
            if (!d) return null
            return (
              <Card key={id}>
                <ArabicText text={t(d.arabic)} className="text-2xl" />
                <p className="mt-1 text-center text-sm font-medium">{t(d.title)}</p>
                <p className="mt-0.5 text-center text-xs text-muted-foreground">{t(d.translation)}</p>
                {d.source && <p className="mt-1 text-center text-[11px] text-gold">{t(d.source)}</p>}
                <Button className="mt-3 w-full" onClick={() => startFree(d.id, d.recommendedCount <= 100 ? d.recommendedCount : 33)}>{t("Start counter")}</Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
