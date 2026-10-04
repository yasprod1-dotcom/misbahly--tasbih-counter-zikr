import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { MAX_NOTIFS_PER_DAY } from '@/domain/constants'
import type { NotificationPreference, TimedReminder } from '@/domain/types'
import { notificationsSupported, permissionState, requestPermission } from '@/services/notifications'
import { useStore } from '@/store/AppStore'

function Toggle({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3.5">
      <div className="min-w-0"><p className="text-sm font-medium">{label}</p>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>
      <Switch checked={on} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}

function Timed({ label, cfg, onChange }: { label: string; cfg: TimedReminder; onChange: (c: TimedReminder) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3">
      <div className="flex items-center gap-3">
        <Switch checked={cfg.on} onCheckedChange={(on) => onChange({ ...cfg, on })} aria-label={label} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Input type="time" value={cfg.time} onChange={(e) => e.target.value && onChange({ ...cfg, time: e.target.value })} className="h-10 w-28" aria-label={label} />
    </div>
  )
}

export function NotificationSettings() {
  const { data, dispatch } = useStore()
  const { t } = useTranslation()
  const p = data.settings.notifications
  const [perm, setPerm] = useState(permissionState())
  const set = (patch: Partial<NotificationPreference>) => dispatch({ type: 'SET_NOTIF', patch })

  const master = async (on: boolean) => {
    if (!on) { set({ enabled: false }); return }
    const r = await requestPermission()
    setPerm(r)
    dispatch({ type: 'SET_PROFILE', patch: { notifAsked: true } })
    if (r === 'granted') set({ enabled: true })
    else toast.message(t('We couldn\'t schedule your reminders. Please check notification permissions in your browser settings.'))
  }

  return (
    <div>
      <Toggle label={t("Gentle reminders")} desc={!notificationsSupported() ? t('Notifications are not supported on this device. In-app nudges still work.') : perm === 'denied' ? t('Notifications are blocked in your browser settings.') : t('Reminders appear while the app is open or installed.')} on={p.enabled} onChange={master} />
      {p.enabled && (
        <>
          <Timed label={t("Morning reminder")} cfg={p.morning} onChange={(morning) => set({ morning })} />
          <Timed label={t("Evening reminder")} cfg={p.evening} onChange={(evening) => set({ evening })} />
          <Timed label={t("Before-sleep reminder")} cfg={p.sleep} onChange={(sleep) => set({ sleep })} />
          <Toggle label={t("Missed dhikr reminder")} desc={t("Learns your usual time and nudges gently if it passes.")} on={p.missed} onChange={(missed) => set({ missed })} />
          <Toggle label={t("Streak reminder")} on={p.streak} onChange={(streak) => set({ streak })} />
          <Toggle label={t("Daily goal reminder")} on={p.goal} onChange={(goal) => set({ goal })} />
          <Toggle label={t("Weekly reflection")} on={p.weekly} onChange={(weekly) => set({ weekly })} />
          <Toggle label={t("Welcome-back reminder")} desc={t("A kind invitation after a few quiet days.")} on={p.rescue} onChange={(rescue) => set({ rescue })} />
          <div className="py-3.5">
            <p className="mb-3 text-sm font-medium">{t('Maximum reminders per day: {{n}}', { n: p.maxPerDay })}</p>
            <Slider min={1} max={MAX_NOTIFS_PER_DAY} step={1} value={[p.maxPerDay]} onValueChange={(v) => set({ maxPerDay: v[0] })} />
            <p className="mt-2 text-xs text-muted-foreground">{t("Reminders you ignore are shown less and less. Completed routines are never reminded.")}</p>
          </div>
        </>
      )}
    </div>
  )
}
