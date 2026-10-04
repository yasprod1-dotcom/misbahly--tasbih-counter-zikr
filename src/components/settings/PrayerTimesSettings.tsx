import { LocateFixed, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { KEY_LABELS } from '@/data/content'
import { PRAYERS } from '@/domain/constants'
import type { PrayerId, PrayerTimesSettings as PrayerSettings } from '@/domain/types'
import { usePrayerToday } from '@/hooks/usePrayerToday'
import { locateDevice, PRAYER_METHODS } from '@/services/prayerTimes'
import { useStore } from '@/store/AppStore'

const round2 = (n: number) => Math.round(n * 100) / 100
const validCoords = (lat: number, lng: number) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180

export function PrayerTimesSettings() {
  const { data, dispatch } = useStore()
  const { t } = useTranslation()
  const { times, failed } = usePrayerToday()
  const p = data.settings.prayerTimes
  const [busy, setBusy] = useState(false)
  const [manual, setManual] = useState({ lat: p.lat != null ? String(p.lat) : '', lng: p.lng != null ? String(p.lng) : '' })
  const set = (patch: Partial<PrayerSettings>) => dispatch({ type: 'SET_PRAYER', patch })

  const locate = async () => {
    setBusy(true)
    try {
      const pos = await locateDevice()
      setManual({ lat: String(pos.lat), lng: String(pos.lng) })
      set({ lat: pos.lat, lng: pos.lng, enabled: true, failed: false })
    } catch (e) {
      toast.message((e as Error).message === 'denied'
        ? t("Location permission was declined. You can enter your coordinates below instead.")
        : t("We couldn't find your location. You can enter your coordinates below instead."))
      // Keep the switch on so the manual fields appear.
      set({ enabled: true })
    } finally { setBusy(false) }
  }

  const saveManual = () => {
    const lat = round2(Number(manual.lat)), lng = round2(Number(manual.lng))
    if (manual.lat.trim() === '' || manual.lng.trim() === '' || !validCoords(lat, lng)) { toast.message(t("Please enter a valid latitude and longitude.")); return }
    set({ lat, lng, enabled: true, failed: false })
  }

  const toggleRemind = (id: PrayerId, on: boolean) => set({ remind: on ? [...new Set([...p.remind, id])] : p.remind.filter((x) => x !== id) })

  const onMaster = (on: boolean) => {
    if (!on) { set({ enabled: false }); return }
    if (p.lat != null && p.lng != null) set({ enabled: true, failed: false })
    else void locate()
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3.5">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("Automatic prayer times")}</p>
          <p className="text-xs text-muted-foreground">{t("Optional. Shows today's prayer times and reminds you for dhikr after prayer.")}</p>
        </div>
        <Switch checked={p.enabled} onCheckedChange={onMaster} disabled={busy} aria-label={t("Automatic prayer times")} />
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-2xl bg-accent/60 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>{t("Only your approximate location (rounded to about 1 km) is sent to the free Aladhan prayer-times service to calculate the times. Nothing else leaves your device, and times are saved here so they work offline.")}</p>
      </div>

      {p.enabled && (
        <div className="space-y-4 pt-4">
          <div>
            <Button variant="outline" size="sm" onClick={() => void locate()} disabled={busy}><LocateFixed className="me-2 h-4 w-4" />{busy ? t("Locating…") : t("Use my location")}</Button>
            <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <label className="space-y-1 text-xs text-muted-foreground">{t("Latitude")}<Input inputMode="decimal" value={manual.lat} onChange={(e) => setManual({ ...manual, lat: e.target.value })} placeholder="21.42" /></label>
              <label className="space-y-1 text-xs text-muted-foreground">{t("Longitude")}<Input inputMode="decimal" value={manual.lng} onChange={(e) => setManual({ ...manual, lng: e.target.value })} placeholder="39.83" /></label>
              <Button size="sm" variant="secondary" className="h-10" onClick={saveManual}>{t("Save")}</Button>
            </div>
          </div>

          <label className="block space-y-1 text-xs text-muted-foreground">{t("Calculation method")}
            <select
              value={p.method == null ? '' : String(p.method)}
              onChange={(e) => set({ method: e.target.value === '' ? null : Number(e.target.value) })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {PRAYER_METHODS.map((m) => <option key={String(m.id)} value={m.id == null ? '' : String(m.id)}>{t(m.label)}</option>)}
            </select>
          </label>

          {times ? (
            <ul className="grid grid-cols-5 gap-1 rounded-2xl border border-border/70 bg-card p-3 text-center text-xs">
              {PRAYERS.map((id) => <li key={id}><p className="text-muted-foreground">{t(KEY_LABELS[id])}</p><p className="mt-0.5 text-sm font-semibold tabular-nums">{times[id]}</p></li>)}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              {p.lat == null ? t("Choose your location to load today's prayer times.") : failed ? t("Couldn't load prayer times. They'll load again when you're back online.") : t("Loading today's prayer times…")}
            </p>
          )}
          {p.lat != null && <Button variant="ghost" size="sm" onClick={() => set({ times: null, failed: false })}>{t("Refresh times")}</Button>}

          <div>
            <p className="text-sm font-medium">{t("Remind me for dhikr after")}</p>
            <p className="mb-1 text-xs text-muted-foreground">{t("{{n}} minutes after each selected prayer, only if you haven't marked it done. Needs gentle reminders to be on; never more than 3 a day.", { n: p.remindAfterMin })}</p>
            {PRAYERS.map((id) => (
              <div key={id} className="flex items-center justify-between border-b border-border/60 py-2.5">
                <span className="text-sm">{t(KEY_LABELS[id])}</span>
                <Switch checked={p.remind.includes(id)} onCheckedChange={(on) => toggleRemind(id, on)} aria-label={t(KEY_LABELS[id])} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
