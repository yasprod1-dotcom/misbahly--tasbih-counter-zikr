import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORIES } from '@/data/content'
import { DHIKR_COLORS } from '@/domain/constants'
import { uid } from '@/domain/dates'
import type { Dhikr, DhikrCategory } from '@/domain/types'
import { useStore } from '@/store/AppStore'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const blank = { title: '', arabic: '', translation: '', count: '33', category: 'custom' as DhikrCategory, reminder: '', color: DHIKR_COLORS[0] }

export function CustomDhikrForm({ open, editing, onOpenChange }: { open: boolean; editing: Dhikr | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const { dispatch } = useStore()
  const [f, setF] = useState(blank)
  useEffect(() => {
    if (!open) return
    setF(editing ? { title: editing.title, arabic: editing.arabic, translation: editing.translation, count: String(editing.recommendedCount), category: editing.categories[0] ?? 'custom', reminder: editing.reminderTime ?? '', color: editing.color ?? DHIKR_COLORS[0] } : blank)
  }, [open, editing])
  const valid = f.title.trim().length > 0 && Number(f.count) >= 1

  const save = () => {
    if (!valid) return
    const d: Dhikr = {
      id: editing?.id ?? `c-${uid()}`, title: f.title.trim(), arabic: f.arabic.trim(), transliteration: f.title.trim(), translation: f.translation.trim(),
      categories: [f.category], recommendedCount: Math.min(100000, Math.floor(Number(f.count))), source: null, refStatus: 'none', custom: true,
      color: f.color, reminderTime: f.reminder || null, createdAt: editing?.createdAt ?? Date.now(),
    }
    dispatch({ type: 'SAVE_CUSTOM', dhikr: d })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-3xl">
        <SheetHeader><SheetTitle>{editing ? t("Edit your dhikr") : t("Create your own dhikr")}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="cd-name">{t("Name")}</Label><Input id="cd-name" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={60} /></div>
          <div className="space-y-1.5"><Label htmlFor="cd-ar">{t("Arabic text")}</Label><Textarea id="cd-ar" dir="rtl" lang="ar" className="font-arabic text-xl" value={f.arabic} onChange={(e) => setF({ ...f, arabic: e.target.value })} rows={2} /></div>
          <div className="space-y-1.5"><Label htmlFor="cd-tr">{t("Translation")}</Label><Input id="cd-tr" value={f.translation} onChange={(e) => setF({ ...f, translation: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="cd-n">{t("Target count")}</Label><Input id="cd-n" inputMode="numeric" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value.replace(/\D/g, '').slice(0, 6) })} /></div>
            <div className="space-y-1.5"><Label htmlFor="cd-t">{t("Daily reminder")}</Label><Input id="cd-t" type="time" value={f.reminder} onChange={(e) => setF({ ...f, reminder: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Category")}</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setF({ ...f, category: c.id })} className={cn('rounded-full border px-3 py-1.5 text-xs', f.category === c.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>{t(c.label)}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Color")}</Label>
            <div className="flex gap-3">
              {DHIKR_COLORS.map((c) => (
                <button key={c} aria-label={t("Color")} onClick={() => setF({ ...f, color: c })} className={cn('h-9 w-9 rounded-full border-2', f.color === c ? 'border-foreground' : 'border-transparent')} style={{ background: `hsl(${c})` }} />
              ))}
            </div>
          </div>
          <Button size="lg" className="w-full" disabled={!valid} onClick={save}>{t("Save")}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
