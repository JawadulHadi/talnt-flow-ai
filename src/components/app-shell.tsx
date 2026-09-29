import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  BarChart3,
  Briefcase,
  ClipboardCheck,
  FileText,
  KanbanSquare,
  RotateCcw,
  Share2,
  Sparkles,
  Users,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtsStore } from "@/stores/ats-store";
import { useUiStore } from "@/stores/ui-store";
import { checkAgentHealth } from "@/lib/ats/ai-service";
import { THEMES, type ThemeName } from "@/lib/ats/types";

const nav = [
  { to: "/", label: "Analytics", icon: BarChart3 },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/team", label: "Team", icon: Users },
  { to: "/integrations", label: "Integrations", icon: Share2 },
  { to: "/scorecard", label: "Scorecard", icon: ClipboardCheck },
  { to: "/deliverables", label: "Deliverables", icon: FileText },
] as const;

const themeLabels: Record<ThemeName, string> = {
  "frosted-slate": "Frosted slate",
  "frosted-ember": "Frosted ember",
  "paper-light": "Paper light",
  "signal-emerald": "Signal emerald",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const fallback = useUiStore((s) => s.fallbackModeActive);
  const setFallback = useUiStore((s) => s.setFallback);
  const resetDemo = useAtsStore((s) => s.resetDemo);

  useEffect(() => {
    void useAtsStore.persist.rehydrate();
    void useUiStore.persist.rehydrate();
    void checkAgentHealth().then((ok) => setFallback(!ok));
  }, [setFallback]);

  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);

  return (
    <div className="min-h-screen">
      {fallback && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 border-b border-border bg-accent/90 px-4 py-2 text-sm font-medium text-accent-foreground animate-in fade-in slide-in-from-top-2"
        >
          <WifiOff className="size-4" />
          Qeloma Agent for Recruiter is offline. You are using the resilient local version —
          recommendations are calculated on this device.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-border bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <Link to="/" className="mr-2 flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-inner">
              <Sparkles className="size-5" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                TalntFlow<span className="text-primary">.ai</span>
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
                ATS & Job Board Hub
              </span>
            </div>
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                activeProps={{
                  className:
                    "bg-primary text-primary-foreground shadow-md hover:bg-primary hover:text-primary-foreground",
                }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <Select value={theme} onValueChange={(v) => setTheme(v as ThemeName)}>
            <SelectTrigger className="w-40" aria-label="Theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t} value={t}>
                  {themeLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" title="Reset demo data" onClick={resetDemo}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </header>
      <main
        key={pathname}
        className="mx-auto max-w-7xl px-4 py-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {children}
      </main>
    </div>
  );
}
