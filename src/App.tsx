import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import AppShell from "./components/app/AppShell"
import ScrollToTop from "./components/ScrollToTop"
import Index from "./pages/Index"
import Journey from "./pages/Journey"
import Library from "./pages/Library"
import Mood from "./pages/Mood"
import NotFound from "./pages/NotFound"
import Onboarding from "./pages/Onboarding"
import OneMinute from "./pages/OneMinute"
import Prayer from "./pages/Prayer"
import Routines from "./pages/Routines"
import Run from "./pages/Run"
import Settings from "./pages/Settings"
import TasbihPage, { QuietMoment } from "./pages/Tasbih"
import { AppProvider } from "./store/AppStore"

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/run" element={<Run />} />
            <Route path="/one-minute" element={<OneMinute />} />
            <Route path="/quiet" element={<QuietMoment />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<Index />} />
              <Route path="/dhikr" element={<Library />} />
              <Route path="/tasbih" element={<TasbihPage />} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/routines" element={<Routines />} />
              <Route path="/prayer" element={<Prayer />} />
              <Route path="/mood" element={<Mood />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
