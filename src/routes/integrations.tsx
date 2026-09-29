import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Globe, Link2, LogIn, Sparkles, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAtsStore } from "@/stores/ats-store";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations & Job Boards — TalntFlow AI" },
      {
        name: "description",
        content:
          "Connect Google Workspace, LinkedIn, Indeed, and external job boards to sync applicants automatically.",
      },
      { property: "og:title", content: "Integrations & Job Boards — TalntFlow AI" },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const integrations = useAtsStore((s) => s.integrations);
  const toggleIntegration = useAtsStore((s) => s.toggleIntegration);

  const handleToggle = (id: string, name: string, connected: boolean) => {
    toggleIntegration(id);
    if (!connected) {
      toast.success(`Successfully connected ${name}! Applicants will now sync automatically.`);
    } else {
      toast.info(`Disconnected ${name}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> Step 1: Authentication & Job Boards
            </span>
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            Integrations & Job Board Sync
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with Google Workspace or connect external job boards to unify candidate
            pipelines into TalntFlow AI.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="glass group flex flex-col justify-between rounded-2xl border border-border/70 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-primary/60"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    {item.category === "Authentication" ? (
                      <LogIn className="size-6" />
                    ) : (
                      <Globe className="size-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.category} Integration</p>
                  </div>
                </div>
                {item.connected ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="size-3.5" /> Connected
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    Disconnected
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {item.connected
                  ? `Active real-time webhooks enabled. Last synced: ${item.lastSynced ?? "Just now"}.`
                  : "Connect with 1-click to import incoming applications and sync stage updates."}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
              <span className="text-[10px] text-muted-foreground">Secure OAuth 2.0 encrypted</span>
              <Button
                onClick={() => handleToggle(item.id, item.name, item.connected)}
                variant={item.connected ? "outline" : "default"}
                className={
                  item.connected
                    ? "gap-2 border-border text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    : "gap-2 bg-primary text-primary-foreground"
                }
              >
                {item.connected ? (
                  <>
                    <Unlink className="size-4" /> Disconnect
                  </>
                ) : (
                  <>
                    <Link2 className="size-4" /> Connect Now
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
