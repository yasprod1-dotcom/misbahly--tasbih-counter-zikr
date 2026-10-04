// All notification text is data: configurable, localized, and swappable via remote content.
export const NOTIF_TITLE = 'Misbahly'

export const NOTIF_COPY: Record<string, string[]> = {
  reminder_morning: [
    'Start your morning with a quiet moment of dhikr 🤍',
    'A new day. Begin it with remembrance.',
  ],
  reminder_evening: [
    'Take a quiet moment for your evening dhikr.',
    'The evening is a gentle time to remember Allah 🤍',
  ],
  reminder_sleep: [
    'Close your day with remembrance before you sleep 🤍',
    'A few quiet words of dhikr before bed.',
  ],
  missed_usual: [
    'Your usual dhikr hasn\'t happened yet. Take a peaceful minute for yourself 🤍',
    'You still have a small moment for dhikr today 🤍',
    'Take a minute from your day and remember Allah.',
  ],
  missed_yesterday: [
    'Yesterday you completed your dhikr. Your routine is waiting for you today 🤍',
    'Yesterday you kept your routine. Don\'t let today pass without your moment of remembrance.',
  ],
  reminder_prayer: [
    '{{name}} time has passed. Take a quiet moment for your dhikr after prayer 🤍',
    'After {{name}}, a few peaceful moments of dhikr are waiting for you 🤍',
  ],
  reminder_custom: ['Time for your {{name}} 🤍'],
  streak: [
    '{{n}} days of consistency. A short dhikr today keeps it going 🤍',
  ],
  goal: [
    'You\'re at {{done}} of {{goal}} today. A little more, whenever you\'re ready 🤍',
  ],
  weekly: [
    'Your weekly reflection is ready. See how your week of dhikr went 🤍',
  ],
  rescue: [
    'Let\'s start again. Just one minute of dhikr 🤍',
    'No pressure. One quiet minute is a beautiful beginning.',
  ],
  suhoor: ['Suhoor time is near. May your night be blessed 🤍'],
  iftar: ['Iftar is near. A moment of dua and dhikr before breaking the fast 🤍'],
}
