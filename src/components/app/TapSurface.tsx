import { useEffect, useRef, useState } from 'react'
import { ArabicText, ProgressRing } from './primitives'
import { cn } from '@/lib/utils'

interface Props {
  count: number
  target: number
  arabic: string
  title: string
  translation?: string
  onTap: () => void
  disabled?: boolean
  quiet?: boolean
  celebrateKey?: number
  hint?: string
}

/** The whole circle is one big tap target. Taps use pointer-down so they register instantly. */
export function TapSurface({ count, target, arabic, title, translation, onTap, disabled, quiet, celebrateKey = 0, hint }: Props) {
  const [ripples, setRipples] = useState<number[]>([])
  const idRef = useRef(0)
  const size = quiet ? 300 : 288
  const long = arabic.length > 40

  useEffect(() => { if (celebrateKey) setRipples((r) => [...r, ++idRef.current]) }, [celebrateKey])

  const handle = () => {
    if (disabled) return
    onTap()
    const id = ++idRef.current
    setRipples((r) => [...r.slice(-2), id])
    window.setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 600)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <ArabicText text={arabic} className={cn(long ? 'text-2xl leading-[2.1]' : 'text-5xl', 'max-h-44 overflow-y-auto px-4 text-foreground')} />
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); handle() }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle() } }}
        aria-label={`${title}: ${count} / ${target}`}
        disabled={disabled}
        className="relative touch-manipulation select-none rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-60"
        style={{ width: size, height: size, WebkitTouchCallout: 'none' }}
      >
        <span className="absolute inset-3 rounded-full bg-gradient-to-b from-accent/70 to-card shadow-lg" />
        {ripples.map((r) => <span key={r} className="tap-ring pointer-events-none absolute inset-3 rounded-full border-2 border-primary/50" />)}
        <ProgressRing value={target > 0 ? count / target : 0} size={size} stroke={9} className="absolute inset-0">
          <span key={count} className="bead-pop font-display text-7xl font-bold tabular-nums text-foreground">{count}</span>
          <span className="mt-1 text-sm text-muted-foreground">/ {target}</span>
        </ProgressRing>
      </button>
      <div className="text-center">
        <p className="text-lg font-semibold">{title}</p>
        {translation && !quiet && <p className="mt-0.5 max-w-xs text-sm text-muted-foreground">{translation}</p>}
        {hint && <p className="mt-2 text-xs uppercase tracking-widest text-gold">{hint}</p>}
      </div>
    </div>
  )
}
