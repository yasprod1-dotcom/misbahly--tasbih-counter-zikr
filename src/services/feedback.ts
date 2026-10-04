// Haptics, sound and screen-wake. Everything is fire-and-forget: a tap never waits on these.
let audio: AudioContext | null = null

export function haptic(on: boolean, pattern: number | number[] = 12) {
  if (!on) return
  try { navigator.vibrate?.(pattern) } catch { /* unsupported */ }
}

export function softTick(on: boolean, freq = 620) {
  if (!on) return
  try {
    audio = audio ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const o = audio.createOscillator()
    const g = audio.createGain()
    o.frequency.value = freq
    o.type = 'sine'
    g.gain.setValueAtTime(0.0001, audio.currentTime)
    g.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.12)
    o.connect(g).connect(audio.destination)
    o.start()
    o.stop(audio.currentTime + 0.13)
  } catch { /* audio blocked */ }
}

type WakeSentinel = { release: () => Promise<void> }
let sentinel: WakeSentinel | null = null

export async function keepAwake(on: boolean) {
  try {
    if (!on) { await sentinel?.release(); sentinel = null; return }
    const nav = navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<WakeSentinel> } }
    if (nav.wakeLock && !sentinel) sentinel = await nav.wakeLock.request('screen')
  } catch { sentinel = null }
}
