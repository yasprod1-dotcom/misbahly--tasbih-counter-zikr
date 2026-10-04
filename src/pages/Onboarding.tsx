import { Bell, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FullScreen } from '@/components/app/primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GOAL_OPTIONS, TIME_OPTIONS } from '@/data/content'
import type { Lang } from '@/domain/types'
import { requestPermission } from '@/services/notifications'
import { useStore } from '@/store/AppStore'
import { cn } from '@/lib/utils'

const LANGS: { id: Lang; label: string }[] = [{ id: 'ar', label: 'العربية' }, { id: 'fr', label: 'Français' }, { id: 'en', label: 'English' }]
const GOAL_FOR_MINUTES: Record<number, number> = { 1: 100, 5: 300, 10: 500, 15: 1000 }
const STEPS = 5

function Choice({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('flex min-h-[56px] w-full items-center rounded-2xl border px-5 text-start text-base transition-colors', on ? 'border-primary bg-accent font-semibold' : 'border-border bg-card hover:bg-muted')}>{children}</button>
  )
}

export default function Onboarding() {
  const { data, dispatch } = useStore()
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(data.profile.name)
  const [goal, setGoal] = useState(data.profile.goal)
  const [times, setTimes] = useState<string[]>([])
  const [customTime, setCustomTime] = useState('13:00')
  const [mins, setMins] = useState(5)
  if (data.profile.onboarded) return <Navigate to="/" replace />

  const finish = async (enable: boolean) => {
    let granted = false
    if (enable) granted = (await requestPermission()) === 'granted'
    const n = data.settings.notifications
    const customHour = Number(customTime.split(':')[0])
    dispatch({
      type: 'SET_SETTINGS',
      patch: {
        dailyGoal: GOAL_FOR_MINUTES[mins] ?? 300,
        notifications: {
          ...n, enabled: granted,
          morning: { ...n.morning, on: times.length === 0 || times.includes('morning') || goal === 'morning-evening', time: times.includes('custom') && customHour < 12 ? customTime : n.morning.time },
          evening: { ...n.evening, on: times.length === 0 || times.includes('evening') || times.includes('afternoon') || goal === 'morning-evening', time: times.includes('custom') && customHour >= 12 ? customTime : n.evening.time },
          sleep: { ...n.sleep, on: times.includes('sleep') },
        },
      },
    })
    dispatch({ type: 'SET_PROFILE', patch: { name: name.trim(), goal, preferredTimes: times, dailyMinutes: mins, onboarded: true, notifAsked: enable } })
    nav('/', { replace: true })
  }

  const toggleTime = (id: string) => setTimes((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1))

  return (
    <FullScreen className="px-6">
      <div className="pt-safe flex h-16 items-center justify-between pt-4">
        {step > 0 ? <button aria-label={t("Back")} onClick={() => setStep(step - 1)} className="-ms-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"><ChevronLeft className="h-5 w-5 rtl:rotate-180" /></button> : <span />}
        <div className="flex gap-1.5">{Array.from({ length: STEPS }, (_, i) => <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border')} />)}</div>
        <span className="w-11" />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6 py-6">
        {step === 0 && (
          <>
            <div>
              <p className="font-arabic text-3xl text-gold" dir="rtl">{t("اذكر، واطمئن، واستمر.")}</p>
              <h1 className="mt-2 text-5xl">{t("Misbahly")}</h1>
              <p className="mt-2 text-muted-foreground">{t("Remember. Reflect. Repeat.")}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("Which language do you prefer?")}</p>
              {LANGS.map((l) => (
                <Choice key={l.id} on={data.settings.language === l.id} onClick={() => { dispatch({ type: 'SET_SETTINGS', patch: { language: l.id } }); void i18n.changeLanguage(l.id) }}>{t(l.label)}</Choice>
              ))}
            </div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Your first name (optional)")} maxLength={40} className="h-12" />
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-4xl">{t("What is your main goal?")}</h1>
            <div className="space-y-2">{GOAL_OPTIONS.map((g) => <Choice key={g.id} on={goal === g.id} onClick={() => setGoal(g.id)}>{t(g.label)}</Choice>)}</div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-4xl">{t("When do you usually prefer Dhikr?")}</h1>
            <p className="-mt-3 text-sm text-muted-foreground">{t("Choose as many as you like.")}</p>
            <div className="space-y-2">{TIME_OPTIONS.map((o) => <Choice key={o.id} on={times.includes(o.id)} onClick={() => toggleTime(o.id)}>{t(o.label)}</Choice>)}</div>
            {times.includes('custom') && <Input type="time" value={customTime} onChange={(e) => e.target.value && setCustomTime(e.target.value)} className="h-12" aria-label={t("Custom time")} />}
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="text-4xl">{t("How much time would you like to spend daily?")}</h1>
            <div className="space-y-2">
              {[2, 5, 10, 15].map((m) => <Choice key={m} on={mins === m} onClick={() => setMins(m)}>{m === 15 ? t('15+ minutes') : t('{{n}} minutes', { n: m })}</Choice>)}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary"><Bell className="h-7 w-7" /></div>
            <h1 className="text-4xl">{t("Gentle reminders?")}</h1>
            <p className="text-muted-foreground">{t("Misbahly can quietly remind you at your usual times and when your routine is still waiting. Never more than a few a day, never pushy, and you control everything in Settings.")}</p>
            <p className="text-sm text-muted-foreground">{t("Your Dhikr history stays on your device.")}</p>
          </>
        )}
      </div>

      <div className="pb-safe space-y-2 pb-6">
        {step < STEPS - 1 ? (
          <Button size="lg" className="h-14 w-full text-base" onClick={next}>{t("Continue")}</Button>
        ) : (
          <>
            <Button size="lg" className="h-14 w-full text-base" onClick={() => finish(true)}>{t("Enable reminders")}</Button>
            <Button size="lg" variant="ghost" className="w-full" onClick={() => finish(false)}>{t("Maybe later")}</Button>
          </>
        )}
      </div>
    </FullScreen>
  )
}
