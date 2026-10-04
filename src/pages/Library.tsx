import { BookOpen, Heart, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card, Empty, PageHeader } from '@/components/app/primitives'
import { CustomDhikrForm } from '@/components/library/CustomDhikrForm'
import { DhikrDetailSheet } from '@/components/library/DhikrDetailSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIES } from '@/data/content'
import type { Dhikr } from '@/domain/types'
import { useDerived } from '@/hooks/useDerived'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export default function Library() {
  const { t } = useTranslation()
  const { data, dhikr } = useDerived()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [open, setOpen] = useState<Dhikr | null>(null)
  const [form, setForm] = useState<{ open: boolean; editing: Dhikr | null }>({ open: false, editing: null })

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return dhikr.filter((d) => {
      if (cat === 'fav' && !data.favorites.includes(d.id)) return false
      if (cat !== 'all' && cat !== 'fav' && !d.categories.includes(cat as never)) return false
      return !needle || d.title.toLowerCase().includes(needle) || d.translation.toLowerCase().includes(needle) || d.transliteration.toLowerCase().includes(needle) || d.arabic.includes(needle)
    })
  }, [dhikr, q, cat, data.favorites])

  const chips = [{ id: 'all', label: 'All' }, { id: 'fav', label: 'Favorites' }, ...CATEGORIES.filter((c) => c.id !== 'custom' || data.customDhikr.length)]

  return (
    <div>
      <PageHeader title={t("Dhikr library")} subtitle={t("Authentic adhkar, organized for your day.")} right={
        <Button size="icon" variant="outline" aria-label={t("Create your own dhikr")} onClick={() => setForm({ open: true, editing: null })}><Plus className="h-5 w-5" /></Button>
      } />
      <div className="relative px-5 pb-2">
        <Search className="absolute start-8 top-3 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search")} className="ps-9" />
      </div>
      <div className="flex gap-2 overflow-x-auto px-5 py-2">
        {chips.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm', cat === c.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}>{t(c.label)}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty icon={cat === 'fav' ? <Heart className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />} title={cat === 'fav' ? t("No favorites yet") : t("Nothing found")} body={cat === 'fav' ? t("Tap the heart on any dhikr to keep it close.") : t("Try another word or category — or create your own dhikr.")} />
      ) : (
        <ul className="px-5">
          {list.map((d) => (
            <li key={d.id}>
              <button onClick={() => setOpen(d)} className="flex w-full items-center gap-3 border-b border-border/60 py-4 text-start transition-colors hover:text-primary">
                <span className="min-w-0 flex-1">
                  <span dir="rtl" lang="ar" className="block truncate font-arabic text-xl">{d.arabic}</span>
                  <span className="mt-0.5 block truncate text-sm font-medium">{d.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{d.translation}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">{d.recommendedCount}×</span>
                  {data.favorites.includes(d.id) && <Heart className="h-4 w-4 fill-current text-destructive" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="px-5 pt-4">
        <Card className="text-xs text-muted-foreground">{t("References marked \"to be verified\" are placeholders until each source is confirmed. Content can be corrected without an app update.")}</Card>
      </div>
      <DhikrDetailSheet dhikr={open} onClose={() => setOpen(null)} onEdit={(d) => setForm({ open: true, editing: d })} />
      <CustomDhikrForm open={form.open} editing={form.editing} onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))} />
    </div>
  )
}
