import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { usageByDhikr } from '@/domain/sessionPlanner'
import { useDerived } from '@/hooks/useDerived'
import { useTranslation } from 'react-i18next'

export function DhikrPickerSheet({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (id: string) => void }) {
  const { t } = useTranslation()
  const { data, dhikr } = useDerived()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const usage = usageByDhikr(data)
    const needle = q.trim().toLowerCase()
    const filtered = dhikr.filter((d) => !needle || d.title.toLowerCase().includes(needle) || d.translation.toLowerCase().includes(needle) || d.arabic.includes(needle))
    const rank = (id: string) => (data.favorites.includes(id) ? 1_000_000 : 0) + (usage.get(id) ?? 0)
    return filtered.sort((a, b) => rank(b.id) - rank(a.id))
  }, [dhikr, data, q])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex h-[80dvh] max-w-md flex-col rounded-t-3xl">
        <SheetHeader><SheetTitle>{t("Choose a dhikr")}</SheetTitle></SheetHeader>
        <div className="relative my-3">
          <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search")} className="ps-9" />
        </div>
        <ul className="-mx-1 flex-1 overflow-y-auto">
          {list.map((d) => (
            <li key={d.id}>
              <button onClick={() => { onPick(d.id); onOpenChange(false) }} className="flex w-full items-center justify-between gap-3 border-b border-border/50 px-1 py-3 text-start hover:text-primary">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{d.translation}</span>
                </span>
                <span className="text-xs text-muted-foreground">{d.recommendedCount}×</span>
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
