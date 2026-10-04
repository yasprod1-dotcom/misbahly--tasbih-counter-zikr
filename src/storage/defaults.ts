import { DEFAULT_FRIDAY_GOAL, DEFAULT_GOAL, DEFAULT_TIMES, DEFAULT_TOLERANCE_MIN, MAX_NOTIFS_PER_DAY, STORAGE_VERSION } from '@/domain/constants'
import { DEFAULT_ROUTINE_SPECS, ROUTINE_NAMES } from '@/data/content'
import type { AppData, AppSettings, DhikrRoutine, UserProfile } from '@/domain/types'

export const defaultSettings = (): AppSettings => ({
  language: 'en',
  theme: 'system',
  haptics: true,
  sound: false,
  reduceMotion: false,
  largeText: false,
  highContrast: false,
  keepAwake: true,
  dailyGoal: DEFAULT_GOAL,
  fridaySalawatGoal: DEFAULT_FRIDAY_GOAL,
  defaultDhikrId: 'subhanallah',
  startOfDayHour: 0,
  showQuote: true,
  notifications: {
    enabled: false,
    morning: { on: true, time: DEFAULT_TIMES.morning },
    evening: { on: true, time: DEFAULT_TIMES.evening },
    sleep: { on: false, time: DEFAULT_TIMES.sleep },
    missed: true, streak: true, goal: false, weekly: true, rescue: true,
    maxPerDay: MAX_NOTIFS_PER_DAY,
    toleranceMin: DEFAULT_TOLERANCE_MIN,
  },
  prayerTimes: { enabled: false, lat: null, lng: null, method: null, remind: [], remindAfterMin: 10, times: null, failed: false },
  ramadan: { enabled: false, suhoorTime: '04:00', iftarTime: '18:30', nightGoal: 300 },
  contentUrl: '',
})

export const defaultProfile = (now: number): UserProfile => ({
  name: '', goal: 'habit', preferredTimes: [], dailyMinutes: 5, onboarded: false, createdAt: now, notifAsked: false,
})

export const defaultRoutines = (now: number): DhikrRoutine[] =>
  DEFAULT_ROUTINE_SPECS.map((s) => ({
    id: s.id, name: ROUTINE_NAMES[s.slot], slot: s.slot, system: true, createdAt: now,
    items: s.items.map(([dhikrId, count], i) => ({ id: `${s.id}-${i}`, dhikrId, count })),
  }))

export const createDefaultData = (now: number): AppData => ({
  version: STORAGE_VERSION,
  profile: defaultProfile(now),
  settings: defaultSettings(),
  customDhikr: [],
  favorites: [],
  routines: defaultRoutines(now),
  sessions: [],
  completions: [],
  active: null,
  unfinished: null,
  moods: [],
  notificationLog: [],
  ignoredByKind: {},
  lastOpenedAt: now,
  lastFinishedRun: null,
})
