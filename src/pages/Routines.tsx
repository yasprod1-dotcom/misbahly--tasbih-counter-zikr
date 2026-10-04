import { ListChecks, Pencil, Play, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Empty, PageHeader } from '@/components/app/primitives'
import { RoutineEditor } from '@/components/routines/RoutineEditor'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/domain/dates'
import { estimateSeconds, totalReps } from '@/domain/sessionPlanner'
import type { DhikrRoutine } from '@/domain/types'
import { useActions } from '@/hooks/useActions'
import { useDerived } from '@/hooks/useDerived'

export default function Routines() {
  const { data, byId } = useDerived()
  const { startRoutine } = useActions()
  const { t } = useTranslation()
  const [editing, setEditing] = useState<DhikrRoutine | 'new' | null>(null)
  return (
    <div>
      <PageHeader back title={t("My routines")} subtitle={t("Build a daily wird that fits your life.")} right={<Button size="icon" variant="outline" aria-label={t("Create routine")} onClick={() => setEditing('new')}><Plus className="h-5 w-5" /></Button>} />
      {data.routines.length === 0 ? (
        <Empty icon={<ListChecks className="h-6 w-6" />} title={t("Create your first daily routine")} body={t("Combine adhkar into a short sequence and run it with one tap.")} action={<Button onClick={() => setEditing('new')}>{t("Create routine")}</Button>} />
      ) : (
        <div className="space-y-3 px-5">
          {data.routines.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-xl">{t(r.name)}</h2>
                  <p className="text-xs text-muted-foreground">{t('{{n}} repetitions · about {{time}}', { n: totalReps(r.items), time: formatDuration(estimateSeconds(r.items)) })}</p>
                </div>
                <Button size="icon" variant="ghost" aria-label={t("Edit")} onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
              </div>
              <ul className="my-3 text-sm text-muted-foreground">
                {r.items.map((i) => <li key={i.id} className="flex justify-between py-0.5"><span>{t(byId.get(i.dhikrId)?.title) ?? i.dhikrId}</span><span>{i.count}×</span></li>)}
              </ul>
              <Button className="w-full" onClick={() => startRoutine(r)} disabled={r.items.length === 0}><Play className="me-2 h-4 w-4 rtl:rotate-180" />{t("Start routine")}</Button>
            </Card>
          ))}
        </div>
      )}
      <RoutineEditor value={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
