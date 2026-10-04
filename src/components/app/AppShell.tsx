import { BookOpen, CircleDot, Home, LineChart, Settings as SettingsIcon } from 'lucide-react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/AppStore'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from "../LanguageToggle"

function Item({ to, label, children, center }: { to: string; label: string; children: React.ReactNode; center?: boolean }) {
  return (
    <NavLink to={to} end={to === '/'} aria-label={label} className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5">
      {({ isActive }) => (
        <>
          <span className={cn(
            'flex items-center justify-center transition-all',
            center ? 'h-14 w-14 -translate-y-3 rounded-full bg-primary text-primary-foreground shadow-lg' : 'h-8 w-12 rounded-full',
            !center && isActive && 'bg-accent text-accent-foreground',
            !center && !isActive && 'text-muted-foreground',
          )}>{children}</span>
          <span className={cn('text-[11px] font-medium', center && '-mt-2', isActive ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function AppShell() {
  const { t } = useTranslation()
  const { data } = useStore()
  if (!data.profile.onboarded) return <Navigate to="/onboarding" replace />
  return (
    <div className="flex min-h-[100dvh] justify-center bg-muted/40">
      <div className="relative min-h-[100dvh] w-full max-w-md bg-background md:shadow-xl">
        <main className="pb-28"><Outlet /></main>
        <nav className="pb-safe fixed bottom-0 start-0 end-0 z-30 mx-auto flex max-w-md items-end border-t border-border/70 bg-background/90 px-2 backdrop-blur" aria-label={t("Main")}>
          <Item to="/" label={t("Home")}><Home className="h-5 w-5" /></Item>
          <Item to="/dhikr" label={t("Dhikr")}><BookOpen className="h-5 w-5" /></Item>
          <Item to="/tasbih" label={t("Tasbih")} center><CircleDot className="h-6 w-6" /></Item>
          <Item to="/journey" label={t("Journey")}><LineChart className="h-5 w-5" /></Item>
          <Item to="/settings" label={t("Settings")}><SettingsIcon className="h-5 w-5" /></Item>
        <LanguageToggle />
        </nav>
      </div>
    </div>
  )
}
