import { Timer, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DhikrPickerSheet } from '@/components/app/DhikrPickerSheet'
import { ArabicText, FullScreen } from '@/components/app/primitives'
import { TapSurface } from '@/components/app/TapSurface'
import { Button } from '@/components/ui/button'
import { ONE_MINUTE_SEC } from '@/domain/constants'
import { suggestOneMinute } from '@/domain/sessionPlanner'
import { useDerived } from '@/hooks/useDerived'
import { useTapper } from '@/hooks/useTapper'
import { keepAwake } from '@/services/feedback'
import { useStore } from '@/store/AppStore'

export default function OneMinute() {
  const { data, dispatch } = useStore()
  const { byId, life } = useDerived()
  const { t } = useTranslation()
  const nav = useNavigate()
  const { tap, celebrateKey } = useTapper()
  const [choice, setChoice] = useState(() => suggestOneMinute(data))
  const [picker, setPicker] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const a = data.active?.kind === 'oneMinute' ? data.active : null
  const left = a ? Math.max(0, ONE_MINUTE_SEC - Math.floor((now - a.startedAt) / 1000)) : ONE_MINUTE_SEC

  useEffect(() => {
    if (!a) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [a?.startedAt])

  useEffect(() => {
    if (a && left <= 0) { setResult(a.count); dispatch({ type: 'FINISH_ACTIVE', now: Date.now(), completed: true }) }
  }, [a, left, dispatch])

  useEffect(() => {
    void keepAwake(!!a)
    return () => { void keepAwake(false) }
  }, [a])

  const start = () => dispatch({ type: 'START_ACTIVE', dhikrId: choice, target: byId.get(choice)?.recommendedCount ?? 100, kind: 'oneMinute', now: Date.now() })
  const quit = () => { if (a) dispatch({ type: 'FINISH_ACTIVE', now: Date.now() }); nav('/') }
  const d = byId.get(a?.dhikrId ?? choice)

  if (result !== null) {
    return (
      <FullScreen className="items-center justify-center gap-5 px-8 text-center">
        <h1 className="text-4xl">{t("You remembered Allah for 1 minute today.")}</h1>
        <p className="text-muted-foreground">{t('{{n}} times · {{m}} minutes of dhikr in total', { n: result, m: life.minutes })}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setResult(null)}>{t("Another minute")}</Button>
          <Button onClick={() => nav('/')}>{t("Done")}</Button>
        </div>
      </FullScreen>
    )
  }

  return (
    <FullScreen>
      <header className="pt-safe flex items-center justify-between px-4 pt-4">
        <button onClick={quit} aria-label={t("Close")} className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        <p className="text-sm font-semibold">{t("1 Minute Dhikr")}</p>
        <span className="w-11" />
      </header>
      {a && d ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <TapSurface count={a.count} target={a.target} arabic={t(d.arabic)} title={t(d.title)} translation={t(d.translation)} onTap={tap} celebrateKey={celebrateKey} hint={`0:${String(left).padStart(2, '0')}`} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary"><Timer className="h-8 w-8" /></div>
          <h1 className="text-4xl">{t("Give me 1 minute.")}</h1>
          <p className="max-w-xs text-muted-foreground">{t("Count as much as you can. No pressure — just a quiet minute of remembrance.")}</p>
          {d && <div className="rounded-2xl border border-border bg-card px-6 py-4"><ArabicText text={t(d.arabic)} className="text-3xl" /><p className="mt-1 text-sm text-muted-foreground">{t(d.title)}</p></div>}
          <div className="flex w-full flex-col gap-2">
            <Button size="lg" onClick={start}>{t("Start")}</Button>
            <Button variant="ghost" onClick={() => setPicker(true)}>{t("Change dhikr")}</Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('{{m}} minutes of dhikr so far', { m: life.minutes })}</p>
        </div>
      )}
      <DhikrPickerSheet open={picker} onOpenChange={setPicker} onPick={setChoice} />
    </FullScreen>
  )
}
