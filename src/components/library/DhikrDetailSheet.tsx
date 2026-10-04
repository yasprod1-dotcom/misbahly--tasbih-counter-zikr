import { Heart, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArabicText } from '@/components/app/primitives'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { uid } from '@/domain/dates'
import type { Dhikr } from '@/domain/types'
import { useActions } from '@/hooks/useActions'
import { useStore } from '@/store/AppStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function DhikrDetailSheet({ dhikr, onClose, onEdit }: { dhikr: Dhikr | null; onClose: () => void; onEdit: (d: Dhikr) => void }) {
  const { data, dispatch } = useStore()
  const { startFree } = useActions()
  const { t, i18n } = useTranslation()
  const [adding, setAdding] = useState(false)
  const fav = dhikr ? data.favorites.includes(dhikr.id) : false
  const refText = !dhikr ? '' : dhikr.refStatus === 'verified' ? t('Reference verified') : dhikr.refStatus === 'pending' ? t('Exact reference to be verified') : t('Reference not added yet')

  const addTo = (routineId: string) => {
    const r = data.routines.find((x) => x.id === routineId)
    if (!r || !dhikr) return
    dispatch({ type: 'SAVE_ROUTINE', routine: { ...r, items: [...r.items, { id: uid(), dhikrId: dhikr.id, count: dhikr.recommendedCount }] } })
    toast.success(t('Added to {{name}}', { name: r.name }))
    setAdding(false)
  }

  return (
    <Sheet open={!!dhikr} onOpenChange={(o) => { if (!o) { setAdding(false); onClose() } }}>
      <SheetContent side="bottom" className="mx-auto max-h-[88dvh] max-w-md overflow-y-auto rounded-t-3xl">
        {dhikr && (
          <>
            <SheetHeader><SheetTitle>{t(dhikr.title)}</SheetTitle></SheetHeader>
            <div className="my-5 space-y-3">
              <ArabicText text={t(dhikr.arabic)} className={dhikr.arabic.length > 60 ? 'text-2xl leading-[2.1]' : 'text-4xl'} />
              {i18n.language !== 'ar' && !dhikr.custom && <p className="text-center text-sm italic text-muted-foreground">{t(dhikr.transliteration)}</p>}
              {dhikr.translation && <p className="text-center text-sm">{t(dhikr.translation)}</p>}
              <div className="hairline" />
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">{t("Recommended count")}</dt><dd className="font-semibold">{dhikr.recommendedCount}×</dd></div>
                <div><dt className="text-xs text-muted-foreground">{t("Source")}</dt><dd className="font-semibold">{t(dhikr.source) ?? '—'}</dd></div>
              </dl>
              {!dhikr.custom && <p className="text-xs text-gold">{refText}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Button size="lg" onClick={() => { onClose(); startFree(dhikr.id, dhikr.recommendedCount <= 1000 ? dhikr.recommendedCount : 33) }}><Play className="me-2 h-4 w-4" />{t("Start counter")}</Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => dispatch({ type: 'TOGGLE_FAV', id: dhikr.id })}>
                  <Heart className={cn('me-2 h-4 w-4', fav && 'fill-current text-destructive')} />{fav ? t("Favorited") : t("Favorite")}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setAdding((a) => !a)}><Plus className="me-2 h-4 w-4" />{t("Add to routine")}</Button>
              </div>
              {adding && (
                <div className="rounded-xl border border-border p-2">
                  {data.routines.map((r) => (
                    <button key={r.id} onClick={() => addTo(r.id)} className="block w-full rounded-lg px-3 py-2.5 text-start text-sm hover:bg-muted">{t(r.name)}</button>
                  ))}
                </div>
              )}
              {dhikr.custom && (
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => { onClose(); onEdit(dhikr) }}><Pencil className="me-2 h-4 w-4" />{t("Edit")}</Button>
                  <Button variant="ghost" className="flex-1 text-destructive" onClick={() => { dispatch({ type: 'DELETE_CUSTOM', id: dhikr.id }); onClose() }}><Trash2 className="me-2 h-4 w-4" />{t("Delete")}</Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
