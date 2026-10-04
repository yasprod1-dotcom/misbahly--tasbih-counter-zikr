import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ListChecks } from 'lucide-react'
import { Card } from '@/components/app/primitives'
import { FridayCard, JourneyList, MissedCards, PrayerNudge, ProgressCard, QuickActions, RamadanCard } from '@/components/home/HomeParts'
import { TimedSessionSheet } from '@/components/home/TimedSessionSheet'
import { QUOTES } from '@/data/content'
import { diffDays, isFriday } from '@/domain/dates'
import { useDerived } from '@/hooks/useDerived'

function Greeting() {
  const { data } = useDerived()
  const { t } = useTranslation()
  const h = new Date().getHours()
  const hello = h < 12 ? t('Good morning') : h < 18 ? t('Good afternoon') : t('Good evening')
  const name = data.profile.name.trim()
  return (
    <header className="pt-safe px-5 pb-2 pt-8">
      <p className="font-arabic text-lg text-gold" dir="rtl">{t("السلام عليكم")}</p>
      <h1 className="text-4xl">{name ? t('{{hello}}, {{name}}', { hello, name }) : hello}</h1>
    </header>
  )
}

function Reflection() {
  const { data, today, progress, insights } = useDerived()
  const { t } = useTranslation()
  const hour = new Date().getHours()
  const quote = QUOTES[Math.abs(diffDays(today, '2020-01-01')) % QUOTES.length]
  const insight = insights[0]
  return (
    <div className="space-y-3 px-5 py-2">
      {hour >= 19 && progress.total > 0 && (
        <Card>
          <p className="text-xs uppercase tracking-wider text-gold">{t("Memory of your day")}</p>
          <p className="mt-1 font-display text-2xl">{t('Today you remembered Allah {{n}} times.', { n: progress.total })}</p>
        </Card>
      )}
      {insight?.id === 'total' && (
        <p className="px-1 text-center text-sm text-muted-foreground">{t('You\'ve remembered Allah {{n}} times.', { n: insight.params.n })}</p>
      )}
      {data.settings.showQuote && (
        <figure className="px-2 py-4 text-center">
          <p dir="rtl" lang="ar" className="font-arabic text-2xl">{t(quote.arabic)}</p>
          <figcaption className="mt-1 text-sm text-muted-foreground">{t(quote.translation)} <span className="text-gold">· {t(quote.source)}</span></figcaption>
        </figure>
      )}
    </div>
  )
}

const Index = () => {
  const { t } = useTranslation()
  const { today, data } = useDerived()
  const [five, setFive] = useState(false)
  const now = Date.now()
  return (
    <div>
      <Greeting />
      <ProgressCard />
      <MissedCards now={now} />
      <PrayerNudge />
      <QuickActions onFive={() => setFive(true)} />
      <JourneyList />
      {isFriday(today) && <FridayCard />}
      {data.settings.ramadan.enabled && <RamadanCard />}
      <div className="px-5 py-1">
        <Link to="/routines" className="flex items-center gap-3 rounded-2xl px-1 py-3 text-sm font-medium text-primary"><ListChecks className="h-5 w-5" />{t("My routines")}</Link>
      </div>
      <Reflection />
      <TimedSessionSheet open={five} onOpenChange={setFive} />
    </div>
  )
}

export default Index
