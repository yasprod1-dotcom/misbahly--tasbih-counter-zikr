// Core domain types. All timestamps are epoch milliseconds (UTC instants).
// Calendar days are stored as "YYYY-MM-DD" keys computed at record time, so a
// later timezone change never rewrites history.

export type Lang = 'ar' | 'fr' | 'en'
export type ThemeMode = 'system' | 'light' | 'dark'
export type DaySlot = 'morning' | 'evening' | 'sleep'
export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
/** Key a completion is recorded under (a daily routine slot or a prayer). */
export type RoutineKey = DaySlot | PrayerId | 'friday'
/** Where a routine lives in the day. */
export type RoutineSlot = DaySlot | 'afterPrayer' | 'friday' | null

export type DhikrCategory =
  | 'morning' | 'evening' | 'afterPrayer' | 'beforeSleep' | 'afterWaking' | 'travel' | 'anxiety'
  | 'gratitude' | 'repentance' | 'friday' | 'ramadan' | 'general' | 'salawat' | 'istighfar' | 'custom'

export type RefStatus = 'verified' | 'pending' | 'none'
export type MoodId = 'peaceful' | 'sad' | 'anxious' | 'stressed' | 'grateful' | 'tired' | 'normal'
export type SessionKind = 'free' | 'routine' | 'oneMinute' | 'quiet' | 'five' | 'catchUp'

export interface Dhikr {
  id: string
  title: string
  arabic: string
  transliteration: string
  translation: string
  categories: DhikrCategory[]
  recommendedCount: number
  /** Reference text. Never invented: null when unknown. */
  source: string | null
  refStatus: RefStatus
  custom?: boolean
  color?: string
  reminderTime?: string | null
  createdAt?: number
}

export interface RoutineItem { id: string; dhikrId: string; count: number }

export interface DhikrRoutine {
  id: string
  name: string
  slot: RoutineSlot
  items: RoutineItem[]
  system?: boolean
  createdAt: number
}

export interface RunState {
  routineId: string | null
  name: string
  key: RoutineKey | null
  items: RoutineItem[]
  index: number
  done: boolean
  kind: SessionKind
}

export interface ActiveSession {
  dhikrId: string
  count: number
  target: number
  startedAt: number
  lastTapAt: number
  activeMs: number
  paused: boolean
  dayKey: string
  tzOffsetMin: number
  kind: SessionKind
  run?: RunState
}

export interface DhikrSession {
  id: string
  dhikrId: string
  routineId: string | null
  kind: SessionKind
  count: number
  target: number
  startedAt: number
  endedAt: number
  activeSec: number
  completed: boolean
  dayKey: string
  tzOffsetMin: number
}

export interface Completion {
  id: string
  key: RoutineKey
  routineId: string | null
  ts: number
  dayKey: string
  tzOffsetMin: number
  /** Minutes since local midnight of dayKey (may exceed 1440 after midnight). */
  minuteOfDay: number
}

export interface DailyProgress {
  dayKey: string
  total: number
  minutes: number
  goalPct: number
  routines: RoutineKey[]
  topDhikrId: string | null
}

export interface HabitPattern {
  key: RoutineKey
  sampleSize: number
  preferredMinute: number | null
  spreadMin: number
  completionRate7: number
  lastCompletedDayKey: string | null
}

export interface TimedReminder { on: boolean; time: string }

export type PrayerTimesMap = Record<PrayerId, string>

/** Opt-in automatic prayer times. Coordinates are rounded (~1 km) and never leave the device except to the provider. */
export interface PrayerTimesSettings {
  enabled: boolean
  lat: number | null
  lng: number | null
  /** Calculation method id (null = provider's closest authority). */
  method: number | null
  /** Prayers that get a gentle "time for dhikr" reminder. */
  remind: PrayerId[]
  remindAfterMin: number
  /** Last downloaded times (cached so they work offline). */
  times: { dayKey: string; sig: string; values: PrayerTimesMap } | null
  failed: boolean
}

export interface NotificationPreference {
  enabled: boolean
  morning: TimedReminder
  evening: TimedReminder
  sleep: TimedReminder
  missed: boolean
  streak: boolean
  goal: boolean
  weekly: boolean
  rescue: boolean
  maxPerDay: number
  toleranceMin: number
}

export type NotifKind = 'reminder' | 'missed' | 'streak' | 'goal' | 'weekly' | 'rescue' | 'suhoor' | 'iftar'

export interface NotificationEvent {
  id: string
  kind: NotifKind
  routineKey: RoutineKey | null
  sentAt: number
  dayKey: string
  status: 'sent' | 'acted' | 'ignored' | 'cancelled'
}

export interface Streak { current: number; longest: number; lastActiveDayKey: string | null }

export interface MoodEntry { id: string; mood: MoodId; ts: number; dayKey: string; suggestedDhikrId: string | null }

export interface UnfinishedDhikr { dhikrId: string; count: number; target: number; dayKey: string }

export interface AppSettings {
  language: Lang
  theme: ThemeMode
  haptics: boolean
  sound: boolean
  reduceMotion: boolean
  largeText: boolean
  highContrast: boolean
  keepAwake: boolean
  dailyGoal: number
  fridaySalawatGoal: number
  defaultDhikrId: string
  startOfDayHour: number
  showQuote: boolean
  notifications: NotificationPreference
  prayerTimes: PrayerTimesSettings
  ramadan: { enabled: boolean; suhoorTime: string; iftarTime: string; nightGoal: number }
  contentUrl: string
}

export interface UserProfile {
  name: string
  goal: string
  preferredTimes: string[]
  dailyMinutes: number
  onboarded: boolean
  createdAt: number
  notifAsked: boolean
}

export interface AppData {
  version: number
  profile: UserProfile
  settings: AppSettings
  customDhikr: Dhikr[]
  favorites: string[]
  routines: DhikrRoutine[]
  sessions: DhikrSession[]
  completions: Completion[]
  active: ActiveSession | null
  unfinished: UnfinishedDhikr | null
  moods: MoodEntry[]
  notificationLog: NotificationEvent[]
  ignoredByKind: Record<string, number>
  lastOpenedAt: number
  lastFinishedRun: { key: RoutineKey | null; name: string; ts: number } | null
}

export interface DailyInsight { id: string; params: Record<string, string | number> }
