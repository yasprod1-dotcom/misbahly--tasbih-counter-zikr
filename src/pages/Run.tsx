import { CheckCircle2, Pause, Play, SkipForward, X } from 'lucide-react'
import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FullScreen } from '@/components/app/primitives'
import { TapSurface } from '@/components/app/TapSurface'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { estimateSeconds, totalReps } from '@/domain/sessionPlanner'
import { formatDuration } from '@/domain/dates'
import { useDerived } from '@/hooks/useDerived'
import { useTapper } from '@/hooks/useTapper'
import { keepAwake } from '@/services/feedback'
import { useStore } from '@/store/AppStore'

export default function Run() {
  const { data, dispatch } = useStore()
  const { byId } = useDerived()
  const { t } = useTranslation()
  const nav = useNavigate()
  const { tap, celebrateKey } = useTapper()
  const a = data.active
  const run = a?.run

  useEffect(() => {
    void keepAwake(data.settings.keepAwake)
    return () => { void keepAwake(false) }
  }, [data.settings.keepAwake])

  if (!a || !run) return <Navigate to="/" replace />
  const exit = () => { dispatch({ type: 'FINISH_ACTIVE', now: Date.now() }); nav('/', { replace: true }) }

  if (run.done) {
    return (
      <FullScreen className="items-center justify-center gap-5 px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-primary"><CheckCircle2 className="h-10 w-10" /></div>
        <h1 className="text-4xl">{t('{{name}} completed 🤍', { name: run.name })}</h1>
        <p className="max-w-xs text-muted-foreground">{t('{{n}} repetitions · about {{time}}', { n: totalReps(run.items), time: formatDuration(estimateSeconds(run.items)) })}</p>
        <p className="font-arabic text-2xl text-gold" dir="rtl">{t("اذكر، واطمئن، واستمر.")}</p>
        <Button size="lg" className="min-w-40" onClick={exit}>{t("Done")}</Button>
      </FullScreen>
    )
  }

  const d = byId.get(a.dhikrId)
  const before = run.items.slice(0, run.index).reduce((s, i) => s + i.count, 0)
  const total = totalReps(run.items)
  return (
    <FullScreen>
      <header className="pt-safe flex items-center justify-between px-4 pt-4">
        <button onClick={exit} aria-label={t("Close")} className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        <div className="text-center">
          <p className="text-sm font-semibold">{t(run.name)}</p>
          <p className="text-xs text-muted-foreground">{t('{{i}} of {{n}}', { i: run.index + 1, n: run.items.length })}</p>
        </div>
        <span className="w-11" />
      </header>
      <div className="px-6 pt-3"><Progress value={Math.min(100, ((before + a.count) / Math.max(1, total)) * 100)} className="h-1.5" /></div>
      <div className="flex flex-1 items-center justify-center px-4 py-4">
        {d && <TapSurface count={a.count} target={a.target} arabic={t(d.arabic)} title={t(d.title)} translation={t(d.translation)} onTap={tap} disabled={a.paused} celebrateKey={celebrateKey} hint={a.paused ? t('Paused') : undefined} />}
      </div>
      <div className="pb-safe flex gap-2 px-6 pb-4">
        <Button variant="outline" className="flex-1" onClick={() => dispatch({ type: 'SET_PAUSED', paused: !a.paused, now: Date.now() })}>
          {a.paused ? <Play className="me-2 h-4 w-4" /> : <Pause className="me-2 h-4 w-4" />}{a.paused ? t("Resume") : t("Pause")}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => dispatch({ type: 'RUN_SKIP', now: Date.now() })}>
          <SkipForward className="me-2 h-4 w-4 rtl:rotate-180" />{t("Next")}
        </Button>
      </div>
    </FullScreen>
  )
}
