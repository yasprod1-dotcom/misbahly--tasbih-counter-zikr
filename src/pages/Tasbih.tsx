import { Check, Flag, Pause, Play, RotateCcw, Undo2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DhikrPickerSheet } from '@/components/app/DhikrPickerSheet'
import { Card, FullScreen } from '@/components/app/primitives'
import { TapSurface } from '@/components/app/TapSurface'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DEFAULT_TARGET, TARGET_CHOICES } from '@/domain/constants'
import { useDerived } from '@/hooks/useDerived'
import { useTapper } from '@/hooks/useTapper'
import { keepAwake } from '@/services/feedback'
import { useStore } from '@/store/AppStore'

function Control({ label, onClick, children, tone }: { label: string; onClick: () => void; children: React.ReactNode; tone?: 'primary' }) {
  return (
    <button onClick={onClick} className="flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium text-muted-foreground transition-colors hover:bg-muted active:scale-95">
      <span className={tone === 'primary' ? 'flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground' : 'flex h-10 w-10 items-center justify-center'}>{children}</span>
      {label}
    </button>
  )
}

export function TasbihView({ quiet = false }: { quiet?: boolean }) {
  const { data, dispatch } = useStore()
  const { byId } = useDerived()
  const { t } = useTranslation()
  const nav = useNavigate()
  const { tap, celebrateKey } = useTapper()
  const [picker, setPicker] = useState(false)
  const [goal, setGoal] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [custom, setCustom] = useState('')
  const a = data.active
  const inRun = !!a?.run && !a.run.done

  // Open → count: a free session is always ready (restored sessions are kept as they were).
  useEffect(() => {
    if (a?.run?.done) { dispatch({ type: 'FINISH_ACTIVE', now: Date.now() }); return }
    if (!a) {
      const id = byId.has(data.settings.defaultDhikrId) ? data.settings.defaultDhikrId : 'subhanallah'
      dispatch({ type: 'START_ACTIVE', dhikrId: id, target: byId.get(id)?.recommendedCount && byId.get(id)!.recommendedCount <= 100 ? byId.get(id)!.recommendedCount : DEFAULT_TARGET, now: Date.now() })
    }
  }, [a, byId, data.settings.defaultDhikrId, dispatch])

  useEffect(() => {
    void keepAwake(data.settings.keepAwake)
    return () => { void keepAwake(false) }
  }, [data.settings.keepAwake])

  const resume = data.unfinished && (!a || a.count === 0) ? data.unfinished : null
  const d = a ? byId.get(a.dhikrId) : undefined
  const pick = (id: string) => {
    const x = byId.get(id)
    dispatch({ type: 'START_ACTIVE', dhikrId: id, target: x && x.recommendedCount <= 1000 ? Math.max(1, x.recommendedCount) : DEFAULT_TARGET, now: Date.now() })
  }
  const finish = () => { dispatch({ type: 'FINISH_ACTIVE', now: Date.now() }); nav('/') }

  const body = (
    <div className={quiet ? 'flex min-h-[100dvh] flex-col' : 'flex flex-col'}>
      {quiet ? (
        <div className="pt-safe flex justify-end p-4">
          <button onClick={() => nav(-1)} aria-label={t("Close")} className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
      ) : (
        <header className="px-5 pb-1 pt-8 text-center"><h1 className="text-3xl">{t("Tasbih")}</h1></header>
      )}

      {resume && !quiet && (
        <div className="px-5 pt-2">
          <Card className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("Continue your unfinished dhikr?")}</p>
              <p className="truncate text-xs text-muted-foreground">{t(byId.get(resume.dhikrId)?.title)} · {resume.count} / {resume.target}</p>
            </div>
            <Button size="sm" onClick={() => dispatch({ type: 'START_ACTIVE', dhikrId: resume.dhikrId, target: resume.target, startCount: resume.count, now: Date.now() })}>{t("Continue")}</Button>
          </Card>
        </div>
      )}

      {inRun && a ? (
        <div className="px-5 pt-6">
          <Card>
            <p className="font-medium">{t(a.run!.name)}</p>
            <p className="mb-3 text-sm text-muted-foreground">{t("A routine is in progress.")}</p>
            <div className="flex gap-2">
              <Button onClick={() => nav('/run')}>{t("Continue routine")}</Button>
              <Button variant="outline" onClick={() => dispatch({ type: 'FINISH_ACTIVE', now: Date.now() })}>{t("Leave routine")}</Button>
            </div>
          </Card>
        </div>
      ) : a && d ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-4">
            <TapSurface
              count={a.count} target={a.target} arabic={t(d.arabic)} title={t(d.title)}
              translation={t(d.translation)} onTap={tap} disabled={a.paused} quiet={quiet} celebrateKey={celebrateKey}
              hint={a.paused ? t('Paused') : a.count >= a.target ? t('Goal reached — continue as you wish') : undefined}
            />
            {!quiet && <button onClick={() => setPicker(true)} className="mt-4 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">{t("Change dhikr")}</button>}
          </div>
          <div className={quiet ? 'pb-safe flex gap-1 px-6 pb-4 opacity-70' : 'flex gap-1 px-4 pb-2'}>
            <Control label={t("Undo")} onClick={() => dispatch({ type: 'UNDO' })}><Undo2 className="h-5 w-5" /></Control>
            <Control label={t("Reset")} onClick={() => a.count > 0 && setConfirmReset(true)}><RotateCcw className="h-5 w-5" /></Control>
            {!quiet && <Control label={t("Goal")} onClick={() => setGoal(true)}><Flag className="h-5 w-5" /></Control>}
            <Control label={a.paused ? t("Resume") : t("Pause")} onClick={() => dispatch({ type: 'SET_PAUSED', paused: !a.paused, now: Date.now() })}>
              {a.paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Control>
            <Control label={t("Finish")} onClick={finish} tone="primary"><Check className="h-5 w-5" /></Control>
          </div>
        </>
      ) : null}

      <DhikrPickerSheet open={picker} onOpenChange={setPicker} onPick={pick} />
      <Sheet open={goal} onOpenChange={setGoal}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          <SheetHeader><SheetTitle>{t("Set your goal")}</SheetTitle></SheetHeader>
          <div className="my-4 grid grid-cols-3 gap-2">
            {TARGET_CHOICES.map((n) => (
              <Button key={n} variant={a?.target === n ? 'default' : 'outline'} onClick={() => { dispatch({ type: 'SET_TARGET', target: n }); setGoal(false) }}>{n}</Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t("Custom number")} />
            <Button disabled={!custom || Number(custom) < 1} onClick={() => { dispatch({ type: 'SET_TARGET', target: Number(custom) }); setCustom(''); setGoal(false) }}>{t("Set")}</Button>
          </div>
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Reset this count?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("Your count for this session goes back to zero. Past sessions stay safe.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Keep counting")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => dispatch({ type: 'RESET_ACTIVE' })}>{t("Reset")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  return quiet ? <FullScreen className="bg-background">{body}</FullScreen> : body
}

export default function TasbihPage() { return <TasbihView /> }
export const QuietMoment = () => <TasbihView quiet />
