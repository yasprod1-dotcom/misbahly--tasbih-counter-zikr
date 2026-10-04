import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DhikrPickerSheet } from '@/components/app/DhikrPickerSheet'
import { PageHeader } from '@/components/app/primitives'
import { DataSettings } from '@/components/settings/DataSettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { PrayerTimesSettings } from '@/components/settings/PrayerTimesSettings'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { GOAL_CHOICES } from '@/domain/constants'
import type { Lang, ThemeMode } from '@/domain/types'
import { useDerived } from '@/hooks/useDerived'
import { useStore } from '@/store/AppStore'
import { cn } from '@/lib/utils'

const LANGS: { id: Lang; label: string }[] = [{ id: 'ar', label: 'العربية' }, { id: 'fr', label: 'Français' }, { id: 'en', label: 'English' }]

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="px-5 py-4"><h2 className="mb-1 text-xl">{title}</h2>{children}</section>
}
function Row({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3.5">
      <div className="min-w-0"><p className="text-sm font-medium">{label}</p>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>
      <Switch checked={on} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}
function Chips<T extends string | number>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-2 py-3">
      {options.map((o) => (
        <button key={String(o.id)} onClick={() => onChange(o.id)} className={cn('min-h-[40px] rounded-full border px-4 text-sm', value === o.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}>{t(o.label)}</button>
      ))}
    </div>
  )
}

export default function Settings() {
  const { data, dispatch } = useStore()
  const { byId } = useDerived()
  const { t, i18n } = useTranslation()
  const [picker, setPicker] = useState(false)
  const s = data.settings
  const set = (patch: Partial<typeof s>) => dispatch({ type: 'SET_SETTINGS', patch })
  const themes: { id: ThemeMode; label: string }[] = [{ id: 'system', label: 'System' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]

  return (
    <div>
      <PageHeader title={t("Settings")} subtitle={t("Everything is in your control.")} />
      <Group title={t("Language")}>
        <Chips value={s.language} options={LANGS} onChange={(l) => { set({ language: l }); void i18n.changeLanguage(l) }} />
      </Group>
      <Group title={t("Appearance")}>
        <Chips value={s.theme} options={themes} onChange={(theme) => set({ theme })} />
        <Row label={t("Large text")} on={s.largeText} onChange={(largeText) => set({ largeText })} />
        <Row label={t("High contrast")} on={s.highContrast} onChange={(highContrast) => set({ highContrast })} />
        <Row label={t("Reduce animation")} on={s.reduceMotion} onChange={(reduceMotion) => set({ reduceMotion })} />
        <Row label={t("Daily reflection")} desc={t("Show a short verse on Home.")} on={s.showQuote} onChange={(showQuote) => set({ showQuote })} />
      </Group>
      <Group title={t("Counter")}>
        <Row label={t("Haptic feedback")} on={s.haptics} onChange={(haptics) => set({ haptics })} />
        <Row label={t("Sound")} on={s.sound} onChange={(sound) => set({ sound })} />
        <Row label={t("Keep screen awake while counting")} on={s.keepAwake} onChange={(keepAwake) => set({ keepAwake })} />
        <button onClick={() => setPicker(true)} className="flex w-full items-center justify-between border-b border-border/60 py-3.5 text-start">
          <span className="text-sm font-medium">{t("Default dhikr")}</span><span className="text-sm text-muted-foreground">{t(byId.get(s.defaultDhikrId)?.title)}</span>
        </button>
      </Group>
      <Group title={t("Daily goal")}>
        <Chips value={s.dailyGoal} options={GOAL_CHOICES.map((n) => ({ id: n, label: String(n) }))} onChange={(dailyGoal) => set({ dailyGoal })} />
        <Chips value={s.startOfDayHour} options={[{ id: 0, label: 'Day starts at midnight' }, { id: 4, label: 'Day starts at 4 AM' }, { id: 5, label: 'Day starts at 5 AM' }]} onChange={(startOfDayHour) => set({ startOfDayHour })} />
        <div className="flex items-center justify-between py-2"><span className="text-sm font-medium">{t("Friday salawat goal")}</span>
          <Input inputMode="numeric" className="h-10 w-24 text-center" value={s.fridaySalawatGoal} onChange={(e) => set({ fridaySalawatGoal: Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1) })} /></div>
      </Group>
      <Group title={t("Ramadan")}>
        <Row label={t("Ramadan mode")} desc={t("Turn on during Ramadan — dates are never assumed.")} on={s.ramadan.enabled} onChange={(enabled) => set({ ramadan: { ...s.ramadan, enabled } })} />
        {s.ramadan.enabled && (
          <div className="grid grid-cols-2 gap-3 py-3">
            <label className="space-y-1 text-xs text-muted-foreground">{t("Suhoor reminder")}<Input type="time" value={s.ramadan.suhoorTime} onChange={(e) => e.target.value && set({ ramadan: { ...s.ramadan, suhoorTime: e.target.value } })} /></label>
            <label className="space-y-1 text-xs text-muted-foreground">{t("Iftar reminder")}<Input type="time" value={s.ramadan.iftarTime} onChange={(e) => e.target.value && set({ ramadan: { ...s.ramadan, iftarTime: e.target.value } })} /></label>
          </div>
        )}
      </Group>
      <Group title={t("Prayer times")}><PrayerTimesSettings /></Group>
      <Group title={t("Notifications")}><NotificationSettings /></Group>
      <Group title={t("Privacy & data")}><DataSettings /></Group>
      <Group title={t("About")}>
        <p className="text-sm text-muted-foreground">{t("Misbahly — Remember. Reflect. Repeat.")}</p>
        <p className="mt-1 font-arabic text-lg" dir="rtl">{t("اذكر، واطمئن، واستمر.")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("Version 1.0 · Works offline · Free for everyone.")}</p>
      </Group>
      <DhikrPickerSheet open={picker} onOpenChange={setPicker} onPick={(id) => set({ defaultDhikrId: id })} />
    </div>
  )
}
