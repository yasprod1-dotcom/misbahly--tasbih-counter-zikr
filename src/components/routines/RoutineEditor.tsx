import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DhikrPickerSheet } from '@/components/app/DhikrPickerSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ROUTINE_NAMES } from '@/data/content'
import { formatDuration, uid } from '@/domain/dates'
import { estimateSeconds, totalReps } from '@/domain/sessionPlanner'
import type { DhikrRoutine, RoutineItem, RoutineSlot } from '@/domain/types'
import { useDerived } from '@/hooks/useDerived'
import { useStore } from '@/store/AppStore'
import { cn } from '@/lib/utils'

const SLOTS: { id: RoutineSlot; label: string }[] = [
  { id: null, label: 'Anytime' }, { id: 'morning', label: 'Morning' }, { id: 'evening', label: 'Evening' },
  { id: 'sleep', label: 'Before sleep' }, { id: 'afterPrayer', label: 'After prayer' }, { id: 'friday', label: 'Friday' },
]

export function RoutineEditor({ value, onClose }: { value: DhikrRoutine | 'new' | null; onClose: () => void }) {
  const { dispatch } = useStore()
  const { byId } = useDerived()
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [slot, setSlot] = useState<RoutineSlot>(null)
  const [items, setItems] = useState<RoutineItem[]>([])
  const [picker, setPicker] = useState(false)
  const isNew = value === 'new'

  useEffect(() => {
    if (value === null) return
    if (value === 'new') { setName(''); setSlot(null); setItems([]) } else { setName(value.name); setSlot(value.slot); setItems(value.items) }
  }, [value])

  const save = () => {
    const base = value && value !== 'new' ? value : null
    const finalName = name.trim() || (slot ? ROUTINE_NAMES[slot] : t('My routine'))
    dispatch({ type: 'SAVE_ROUTINE', routine: { id: base?.id ?? `r-${uid()}`, name: finalName, slot, items: items.filter((i) => i.count > 0), system: base?.system, createdAt: base?.createdAt ?? Date.now() } })
    onClose()
  }
  const setCount = (id: string, n: number) => setItems((l) => l.map((i) => (i.id === id ? { ...i, count: Math.max(1, Math.min(100000, n || 1)) } : i)))

  return (
    <Sheet open={value !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-3xl">
        <SheetHeader><SheetTitle>{isNew ? t("New routine") : t("Edit routine")}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="rt-name">{t("Name")}</Label><Input id="rt-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder={t("My Morning Routine")} /></div>
          <div className="space-y-1.5">
            <Label>{t("When")}</Label>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => <button key={String(s.id)} onClick={() => setSlot(s.id)} className={cn('rounded-full border px-3 py-1.5 text-xs', slot === s.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>{t(s.label)}</button>)}
            </div>
          </div>
          <div>
            <Label>{t("Dhikr in this routine")}</Label>
            <ul className="mt-1">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-2 border-b border-border/60 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{t(byId.get(i.dhikrId)?.title) ?? i.dhikrId}</span>
                  <Input aria-label={t("Count")} inputMode="numeric" className="h-10 w-20 text-center" value={i.count} onChange={(e) => setCount(i.id, Number(e.target.value.replace(/\D/g, '')))} />
                  <button aria-label={t("Remove")} onClick={() => setItems((l) => l.filter((x) => x.id !== i.id))} className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-2 w-full" onClick={() => setPicker(true)}><Plus className="me-2 h-4 w-4" />{t("Add dhikr")}</Button>
          </div>
          <p className="text-sm text-muted-foreground">{t('Total: {{n}} repetitions · about {{time}}', { n: totalReps(items), time: formatDuration(estimateSeconds(items)) })}</p>
          <div className="flex gap-2">
            {value && value !== 'new' && !value.system && (
              <Button variant="outline" className="text-destructive" onClick={() => { dispatch({ type: 'DELETE_ROUTINE', id: value.id }); onClose() }}><Trash2 className="h-4 w-4" /></Button>
            )}
            <Button size="lg" className="flex-1" disabled={items.length === 0} onClick={save}>{t("Save routine")}</Button>
          </div>
        </div>
        <DhikrPickerSheet open={picker} onOpenChange={setPicker} onPick={(id) => setItems((l) => [...l, { id: uid(), dhikrId: id, count: byId.get(id)?.recommendedCount ?? 33 }])} />
      </SheetContent>
    </Sheet>
  )
}
