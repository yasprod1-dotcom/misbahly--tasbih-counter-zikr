import { Download, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { download, toCsv, toJson } from '@/storage/exporters'
import { clearAllData } from '@/storage/storage'
import { useStore } from '@/store/AppStore'
import { useTranslation } from 'react-i18next'

export function DataSettings() {
  const { t } = useTranslation()
  const { data, dispatch } = useStore()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState<'history' | 'all' | null>(null)
  const stamp = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-2xl bg-accent/60 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>{t("Your Dhikr history stays on your device. No account is needed, and nothing is sent anywhere. Cloud backup, if added later, will always be opt-in.")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => { download(`misbahly-${stamp}.json`, toJson(data), 'application/json'); toast.success(t("Your data was exported.")) }}><Download className="me-2 h-4 w-4" />{t("Export JSON")}</Button>
        <Button variant="outline" onClick={() => { download(`misbahly-${stamp}.csv`, toCsv(data), 'text/csv'); toast.success(t("Your data was exported.")) }}><Download className="me-2 h-4 w-4" />{t("Export CSV")}</Button>
      </div>
      <Button variant="outline" className="w-full" onClick={() => setConfirm('history')}>{t("Reset history")}</Button>
      <Button variant="outline" className="w-full text-destructive" onClick={() => setConfirm('all')}><Trash2 className="me-2 h-4 w-4" />{t("Delete all data")}</Button>
      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'all' ? t("Delete everything?") : t("Reset your history?")}</AlertDialogTitle>
            <AlertDialogDescription>{confirm === 'all' ? t("This removes your history, routines, custom dhikr and settings from this device. It cannot be undone.") : t("Your counts, streaks and insights start fresh. Routines and settings stay.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Keep my data")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (confirm === 'all') { clearAllData(); dispatch({ type: 'DELETE_ALL', now: Date.now() }); nav('/onboarding', { replace: true }) }
              else dispatch({ type: 'RESET_HISTORY', now: Date.now() })
            }}>{confirm === 'all' ? t("Delete everything") : t("Reset")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
