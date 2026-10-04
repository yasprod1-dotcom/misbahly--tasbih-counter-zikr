import type { DhikrCategory, MoodId, RoutineKey, RoutineSlot } from '@/domain/types'

export const CATEGORIES: { id: DhikrCategory; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'evening', label: 'Evening' },
  { id: 'afterPrayer', label: 'After prayer' },
  { id: 'beforeSleep', label: 'Before sleep' },
  { id: 'afterWaking', label: 'After waking' },
  { id: 'travel', label: 'Travel' },
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'repentance', label: 'Repentance' },
  { id: 'friday', label: 'Friday' },
  { id: 'ramadan', label: 'Ramadan' },
  { id: 'general', label: 'General dhikr' },
  { id: 'salawat', label: 'Salawat' },
  { id: 'istighfar', label: 'Istighfar' },
  { id: 'custom', label: 'My dhikr' },
]

export const MOODS: { id: MoodId; label: string; emoji: string; dhikr: string[] }[] = [
  { id: 'peaceful', label: 'Peaceful', emoji: '😌', dhikr: ['subhanallah', 'alhamdulillah', 'allahuakbar'] },
  { id: 'sad', label: 'Sad', emoji: '😔', dhikr: ['yunus', 'hamm', 'hasbunallah'] },
  { id: 'anxious', label: 'Anxious', emoji: '😰', dhikr: ['hasbunallah', 'hasbiya', 'lahawla'] },
  { id: 'stressed', label: 'Stressed', emoji: '😤', dhikr: ['lahawla', 'astaghfirullah', 'hasbiya'] },
  { id: 'grateful', label: 'Grateful', emoji: '❤️', dhikr: ['alhamdulillah_rabb', 'alhamdulillah', 'subhanallah_bihamdihi'] },
  { id: 'tired', label: 'Tired', emoji: '😴', dhikr: ['lahawla', 'subhanallah_bihamdihi', 'astaghfirullah'] },
  { id: 'normal', label: 'Normal', emoji: '🙂', dhikr: ['subhanallah', 'astaghfirullah', 'salawat'] },
]

// Quran verses only (verified references). Add more via remote content.
export const QUOTES: { id: string; arabic: string; translation: string; source: string }[] = [
  { id: 'q1', arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', translation: 'Verily, in the remembrance of Allah do hearts find rest.', source: 'Quran 13:28' },
  { id: 'q2', arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ', translation: 'So remember Me; I will remember you.', source: 'Quran 2:152' },
  { id: 'q3', arabic: 'وَاذْكُر رَّبَّكَ فِي نَفْسِكَ', translation: 'And remember your Lord within yourself.', source: 'Quran 7:205' },
  { id: 'q4', arabic: 'وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ', translation: 'And the men and women who remember Allah often.', source: 'Quran 33:35' },
]

// Friday content is configurable data (remote-updatable). Hadith-based items are
// flagged pending until their exact references are verified.
export const FRIDAY_ACTIONS: { id: string; text: string; refStatus: 'verified' | 'pending' }[] = [
  { id: 'salawat', text: 'Send abundant blessings upon the Prophet ﷺ', refStatus: 'pending' },
  { id: 'kahf', text: 'Read Surah al-Kahf', refStatus: 'pending' },
  { id: 'dua', text: 'Make a sincere dua during the day', refStatus: 'pending' },
  { id: 'jumuah', text: 'Prepare calmly for the Friday prayer', refStatus: 'pending' },
]

export const ROUTINE_NAMES: Record<Exclude<RoutineSlot, null>, string> = {
  morning: 'Morning Dhikr',
  evening: 'Evening Dhikr',
  sleep: 'Before Sleep',
  afterPrayer: 'After Prayer',
  friday: 'Friday Dhikr',
}

export const KEY_LABELS: Record<RoutineKey, string> = {
  morning: 'Morning Dhikr',
  evening: 'Evening Dhikr',
  sleep: 'Before Sleep',
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  friday: 'Friday Dhikr',
}

export const GOAL_OPTIONS = [
  { id: 'habit', label: 'Build a daily Dhikr habit' },
  { id: 'increase', label: 'Increase my Dhikr' },
  { id: 'never-forget', label: 'Never forget my daily adhkar' },
  { id: 'track', label: 'Track my progress' },
  { id: 'morning-evening', label: 'Morning & evening adhkar' },
]

export const TIME_OPTIONS = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'sleep', label: 'Before sleeping' },
  { id: 'afterPrayer', label: 'After prayers' },
  { id: 'custom', label: 'Custom' },
]

export const DEFAULT_ROUTINE_SPECS: { id: string; slot: Exclude<RoutineSlot, null>; items: [string, number][] }[] = [
  { id: 'r-morning', slot: 'morning', items: [['ayat_kursi', 1], ['astaghfirullah', 100], ['subhanallah', 33], ['alhamdulillah', 33], ['allahuakbar', 34]] },
  { id: 'r-evening', slot: 'evening', items: [['ayat_kursi', 1], ['ikhlas', 3], ['falaq', 3], ['nas', 3], ['hasbiya', 7], ['astaghfirullah', 33]] },
  { id: 'r-sleep', slot: 'sleep', items: [['ayat_kursi', 1], ['ikhlas', 3], ['falaq', 3], ['nas', 3], ['subhanallah', 33], ['alhamdulillah', 33], ['allahuakbar', 34]] },
  { id: 'r-after', slot: 'afterPrayer', items: [['astaghfirullah', 3], ['subhanallah', 33], ['alhamdulillah', 33], ['allahuakbar', 34]] },
  { id: 'r-friday', slot: 'friday', items: [['salawat', 100], ['astaghfirullah', 33]] },
]
