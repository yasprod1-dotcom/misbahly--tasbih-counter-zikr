import type { AppData } from '@/domain/types'

/**
 * Cloud sync contract. Sync is OPT-IN and not enabled: all data stays on the
 * device. A backend (accounts, backup, multi-device) later only needs to
 * implement this interface; the domain and UI layers never talk to a server.
 */
export interface SyncAdapter {
  readonly enabled: boolean
  push(data: AppData): Promise<void>
  pull(): Promise<AppData | null>
}

export const localOnlySync: SyncAdapter = { enabled: false, push: async () => undefined, pull: async () => null }
export let syncAdapter: SyncAdapter = localOnlySync
export const setSyncAdapter = (a: SyncAdapter) => { syncAdapter = a }

/** Feature flags for future paid extras — the core experience is always free. */
export const ENTITLEMENTS = { cloudSync: false, advancedInsights: false, widgets: false, extraThemes: false } as const
