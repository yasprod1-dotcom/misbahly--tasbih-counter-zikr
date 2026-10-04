import { CONTENT_CACHE_KEY } from '@/domain/constants'
import type { Dhikr } from '@/domain/types'
import { LIBRARY_CORE } from '@/data/dhikrLibrary'
import { LIBRARY_MORE } from '@/data/dhikrLibraryMore'

// Content layer: bundled library + optional remote overrides (cached offline).
// Remote JSON shape: { "dhikr": Dhikr[] } — merged by id, so content can be
// added or corrected without an app update.
export const BUNDLED: Dhikr[] = [...LIBRARY_CORE, ...LIBRARY_MORE]

const valid = (x: unknown): x is Dhikr =>
  typeof x === 'object' && x !== null && typeof (x as Dhikr).id === 'string' && typeof (x as Dhikr).arabic === 'string' && typeof (x as Dhikr).title === 'string'

let remote: Dhikr[] = []
try {
  const cached = JSON.parse(localStorage.getItem(CONTENT_CACHE_KEY) ?? '[]')
  if (Array.isArray(cached)) remote = cached.filter(valid)
} catch { /* ignore */ }

export function allDhikr(custom: Dhikr[]): Dhikr[] {
  const map = new Map<string, Dhikr>()
  for (const d of [...BUNDLED, ...remote]) map.set(d.id, d)
  for (const d of custom) map.set(d.id, { ...d, custom: true })
  return [...map.values()]
}

export async function refreshRemoteContent(url: string): Promise<boolean> {
  if (!url || !navigator.onLine) return false
  try {
    const res = await fetch(url)
    const json = await res.json()
    const list = Array.isArray(json?.dhikr) ? (json.dhikr as unknown[]).filter(valid) : []
    remote = list
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}
