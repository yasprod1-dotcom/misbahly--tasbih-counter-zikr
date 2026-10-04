import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export function ProgressRing({ value, size = 200, stroke = 10, children, className }: { value: number; size?: number; stroke?: number; children?: ReactNode; className?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset 0.35s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

export function ArabicText({ text, className }: { text: string; className?: string }) {
  return <p dir="rtl" lang="ar" className={cn('font-arabic text-center', className)}>{text}</p>
}

export function PageHeader({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  return (
    <header className="pt-safe flex items-start gap-3 px-5 pb-3 pt-6">
      {back && (
        <button onClick={() => nav(-1)} aria-label={t("Back")} className="-ms-2 mt-1 flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-muted">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function Block({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('px-5 py-4', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h2 className="text-xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = cn('rounded-2xl border border-border/70 bg-card p-4 text-start shadow-sm', onClick && 'w-full transition-colors hover:bg-accent/40 active:scale-[0.99]', className)
  return onClick ? <button onClick={onClick} className={cls}>{children}</button> : <div className={cls}>{children}</div>
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">{icon}</div>
      <h3 className="text-xl">{title}</h3>
      <p className="max-w-xs text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  )
}

export function FullScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-muted/40">
      <div className={cn('relative flex min-h-[100dvh] w-full max-w-md flex-col bg-background md:shadow-xl', className)}>{children}</div>
    </div>
  )
}
