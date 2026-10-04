import { allDhikr } from '@/content/contentProvider'
import type { AppData } from '@/domain/types'

const csvCell = (v: string | number | boolean) => `"${String(v).replace(/"/g, '""')}"`

export function toCsv(data: AppData): string {
  const names = new Map(allDhikr(data.customDhikr).map((d) => [d.id, d.title]))
  const routines = new Map(data.routines.map((r) => [r.id, r.name]))
  const rows = [['Date', 'Dhikr', 'Count', 'Duration (sec)', 'Routine', 'Completed']]
  for (const s of data.sessions) {
    rows.push([s.dayKey, names.get(s.dhikrId) ?? s.dhikrId, String(s.count), String(s.activeSec), s.routineId ? routines.get(s.routineId) ?? '' : '', s.completed ? 'yes' : 'no'])
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n')
}

export const toJson = (data: AppData): string => JSON.stringify({ exportedAt: new Date().toISOString(), app: 'Misbahly', data }, null, 2)

export function download(filename: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
