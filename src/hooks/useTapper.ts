import { useState } from 'react'
import { CELEBRATE_EVERY } from '@/domain/constants'
import { haptic, softTick } from '@/services/feedback'
import { useStore } from '@/store/AppStore'

/** Instant tap: updates local state first; haptics/sound/animation never block it. */
export function useTapper() {
  const { data, dispatch } = useStore()
  const [celebrateKey, setCelebrateKey] = useState(0)
  const { haptics, sound } = data.settings
  const a = data.active

  const tap = () => {
    if (!a || a.paused || a.run?.done) return
    dispatch({ type: 'TAP', now: Date.now() })
    const n = a.count + 1
    const goal = n === a.target
    const milestone = !goal && n % CELEBRATE_EVERY === 0
    haptic(haptics, goal ? [18, 50, 18] : milestone ? [12, 40, 12] : 8)
    softTick(sound, goal ? 880 : milestone ? 740 : 620)
    if (goal || milestone) setCelebrateKey((k) => k + 1)
  }
  return { tap, celebrateKey }
}
