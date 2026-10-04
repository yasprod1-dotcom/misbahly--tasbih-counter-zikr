import { LineChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Empty } from '@/components/app/primitives'
import { KEY_LABELS } from '@/data/content'
import { mostMissedRoutine } from '@/domain/stats'
import type { DailyInsight, RoutineKey } from '@/domain/types'
import { useDerived } from '@/hooks/useDerived'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <p className="font-display text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function InsightsTab() {
  const { data, today, life, streak, week, month, insights } = useDerived()
  const { t, i18n } = useTranslation()
  const missed = mostMissedRoutine(data, today)

  const weekday = (d: number) => new Intl.DateTimeFormat(i18n.language, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + d)))
  const line = (i: DailyInsight): string => {
    const p = i.params
    switch (i.id) {
      case 'total': return t('You\'ve remembered Allah {{n}} times.', { n: p.n })
      case 'days30': return t('You\'ve practiced Dhikr on {{n}} of the last 30 days.', { n: p.n })
      case 'avg': return t('Your average daily Dhikr is {{n}}.', { n: p.n })
      case 'longest': return t('Your longest consistency streak is {{n}} days.', { n: p.n })
      case 'weekday': return t('Your strongest day is {{day}}.', { day: weekday(Number(p.d)) })
      case 'time': return t('{{part}} is your most consistent time.', { part: t(String(p.b).charAt(0).toUpperCase() + String(p.b).slice(1)) })
      case 'chain': return t('You\'ve completed your {{name}} {{n}} days in a row.', { name: t(KEY_LABELS[p.key as RoutineKey]), n: p.n })
      default: return ''
    }
  }

  if (life.count === 0) {
    return <Empty icon={<LineChart className="h-6 w-6" />} title={t("Your journey begins with your first Dhikr")} body={t("Count a few remembrances and your insights will appear here — gently, never as a score.")} />
  }
  return (
    <div className="space-y-5 px-5 pb-6">
      <Card className="bg-primary text-primary-foreground">
        <p className="font-display text-5xl font-bold tabular-nums">{life.count.toLocaleString()}</p>
        <p className="mt-1 text-sm opacity-90">{t("times you've remembered Allah")}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("Current streak (days)")} value={streak.current} />
        <Stat label={t("Longest streak (days)")} value={streak.longest} />
        <Stat label={t("Active days this week")} value={`${week} / 7`} />
        <Stat label={t("Active days this month")} value={`${month} / 30`} />
        <Stat label={t("Minutes of dhikr")} value={life.minutes} />
        <Stat label={t("Days with dhikr")} value={life.days} />
      </div>
      {streak.current === 0 && streak.longest > 0 && <p className="text-center text-sm text-muted-foreground">{t("Yesterday was yesterday. Begin again today.")}</p>}
      <section>
        <h2 className="mb-2 text-xl">{t("What we noticed")}</h2>
        <ul>
          {insights.map((i) => <li key={i.id + String(i.params.key ?? '')} className="border-b border-border/60 py-3 text-sm">{line(i)}</li>)}
          {missed && <li className="border-b border-border/60 py-3 text-sm text-muted-foreground">{t('A gentle focus: your {{name}} would love a little more attention.', { name: t(KEY_LABELS[missed]) })}</li>}
        </ul>
      </section>
    </div>
  )
}
