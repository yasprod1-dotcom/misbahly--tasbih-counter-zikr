import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { KEY_LABELS } from '@/data/content'
import { addDays, formatDuration, weekdayOf } from '@/domain/dates'
import { getDayProgress, totalsByDay } from '@/domain/stats'
import { useDerived } from '@/hooks/useDerived'
import { cn } from '@/lib/utils'

const shade = (pct: number) => (pct <= 0 ? '' : pct < 25 ? 'bg-primary/15' : pct < 50 ? 'bg-primary/30' : pct < 100 ? 'bg-primary/50 text-foreground' : 'bg-primary text-primary-foreground')

export function HistoryTab() {
  const { data, today, byId } = useDerived()
  const { t, i18n } = useTranslation()
  const [cursor, setCursor] = useState(today.slice(0, 7))
  const [sel, setSel] = useState<string | null>(null)
  const totals = useMemo(() => totalsByDay(data), [data.sessions, data.active?.count, data.active?.dayKey])
  const first = `${cursor}-01`
  const [y, m] = cursor.split('-').map(Number)
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells = [...Array(weekdayOf(first)).fill(null), ...Array.from({ length: dim }, (_, i) => `${cursor}-${String(i + 1).padStart(2, '0')}`)] as (string | null)[]
  const move = (n: number) => { const d = new Date(Date.UTC(y, m - 1 + n, 1)); setCursor(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`) }
  const fmt = (opts: Intl.DateTimeFormatOptions, d: Date) => new Intl.DateTimeFormat(i18n.language, { timeZone: 'UTC', ...opts }).format(d)
  const detail = sel ? getDayProgress(data, sel) : null
  const daySessions = sel ? data.sessions.filter((s) => s.dayKey === sel) : []

  return (
    <div className="px-5 pb-6">
      <div className="mb-3 flex items-center justify-between">
        <button aria-label={t("Previous month")} onClick={() => move(-1)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"><ChevronLeft className="h-5 w-5 rtl:rotate-180" /></button>
        <h2 className="text-xl">{fmt({ month: 'long', year: 'numeric' }, new Date(Date.UTC(y, m - 1, 1)))}</h2>
        <button aria-label={t("Next month")} onClick={() => move(1)} disabled={cursor >= today.slice(0, 7)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30"><ChevronRight className="h-5 w-5 rtl:rotate-180" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {Array.from({ length: 7 }, (_, i) => <span key={i} className="pb-1 text-[11px] text-muted-foreground">{fmt({ weekday: 'narrow' }, new Date(Date.UTC(2024, 0, 7 + i)))}</span>)}
        {cells.map((k, i) => k ? (
          <button key={k} onClick={() => setSel(k)} className={cn('flex aspect-square items-center justify-center rounded-xl border text-sm tabular-nums transition-colors', shade(Math.min(100, ((totals.get(k) ?? 0) / data.settings.dailyGoal) * 100)), k === today ? 'border-gold' : 'border-border/60')}>
            {Number(k.slice(8))}
          </button>
        ) : <span key={`b${i}`} />)}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">{t("Darker days reached more of your daily goal.")}</p>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-md overflow-y-auto rounded-t-3xl">
          {sel && detail && (
            <>
              <SheetHeader><SheetTitle>{fmt({ weekday: 'long', day: 'numeric', month: 'long' }, new Date(`${sel}T00:00:00Z`))}</SheetTitle></SheetHeader>
              {detail.total === 0 && detail.routines.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t("No dhikr recorded on this day.")} {sel === addDays(today, 0) ? t("Your first remembrance can start now.") : ''}</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="font-display text-3xl font-bold">{detail.total}</p><p className="text-xs text-muted-foreground">{t("Dhikr")}</p></div>
                    <div><p className="font-display text-3xl font-bold">{detail.minutes}</p><p className="text-xs text-muted-foreground">{t("Minutes")}</p></div>
                    <div><p className="font-display text-3xl font-bold">{detail.goalPct}%</p><p className="text-xs text-muted-foreground">{t("Goal")}</p></div>
                  </div>
                  {detail.topDhikrId && <p className="text-sm">{t('Most counted: {{name}}', { name: byId.get(detail.topDhikrId)?.title ?? '' })}</p>}
                  {detail.routines.length > 0 && <p className="text-sm">{detail.routines.map((r) => t(KEY_LABELS[r])).join(' · ')} ✓</p>}
                  <ul>
                    {daySessions.map((s) => (
                      <li key={s.id} className="flex justify-between border-b border-border/50 py-2 text-sm">
                        <span>{t(byId.get(s.dhikrId)?.title) ?? s.dhikrId}</span>
                        <span className="text-muted-foreground">{s.count}× · {formatDuration(s.activeSec)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
