export const STORAGE_KEY = 'misbahly:data'
export const WIDGET_KEY = 'misbahly:widget'
export const CONTENT_CACHE_KEY = 'misbahly:content'
export const STORAGE_VERSION = 1
export const PERSIST_DEBOUNCE_MS = 400

export const MAX_COUNT = 1_000_000
export const MAX_SESSIONS = 20_000
export const SEC_PER_COUNT = 1.3
export const TRANSITION_SEC = 3
export const IDLE_CAP_MS = 15_000
export const ONE_MINUTE_SEC = 60
export const CELEBRATE_EVERY = 33
export const DEFAULT_TARGET = 33
export const DEFAULT_GOAL = 300
export const DEFAULT_FRIDAY_GOAL = 100

export const PATTERN_WINDOW = 7
export const PATTERN_LOOKBACK_DAYS = 21
export const MIN_PATTERN_SAMPLES = 3
export const DEFAULT_TOLERANCE_MIN = 45
export const MISSED_WINDOW_MIN = 180

export const MAX_NOTIFS_PER_DAY = 3
export const TICK_MS = 30_000
export const STALE_NOTIF_MS = 3 * 3_600_000
export const IGNORE_AFTER_MS = 3 * 3_600_000
export const IGNORED_REDUCE_AT = 3
export const IGNORED_PAUSE_AT = 6
export const RESCUE_AFTER_DAYS = 3
export const RESCUE_MAX_DAYS = 30
export const STREAK_REMINDER_MIN_DAYS = 3
export const MIN_ACTIVE_COUNT = 1
export const LOG_KEEP_DAYS = 14

export const DEFAULT_TIMES = { morning: '07:00', evening: '20:00', sleep: '22:00' } as const
export const WEEKLY_REFLECTION = { weekday: 0, time: '19:00' }
export const GOAL_REMINDER_TIME = '21:00'
export const STREAK_REMINDER_TIME = '19:30'
export const RESCUE_TIME = '10:00'

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
export const GOAL_CHOICES = [100, 200, 300, 500, 1000]
export const TARGET_CHOICES = [10, 33, 99, 100, 300, 1000]
export const MIN_CHOICES = [1, 5, 10, 15]
export const DHIKR_COLORS = ['160 58% 28%', '41 62% 44%', '201 55% 40%', '340 40% 45%', '270 30% 48%', '25 60% 45%']
