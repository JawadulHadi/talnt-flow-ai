import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Globe, Info, Link2, LogIn, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAtsStore } from "@/stores/ats-store";
import { timeAgo } from "@/lib/ats/analytics";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — TalntFlow AI" },
      {
        name: "description",
        content: "Connect sign-in, job boards and HRIS systems to TalntFlow AI.",
      },
      { property: "og:title", content: "Integrations — TalntFlow AI" },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const integrations = useAtsStore((s) => s.integrations);
  const toggleIntegration = useAtsStore((s) => s.toggleIntegration);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Connections</p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign-in, job boards and HRIS systems that feed candidates into TalntFlow AI.
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-border bg-secondary/60 p-3 text-sm text-secondary-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Connections are simulated in this build: toggling one records its state but exchanges no
          data. Each provider needs OAuth credentials configured on the server before it can sync.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="glass flex flex-col justify-between p-6 transition-all duration-300 hover:border-primary/60"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
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
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                {item.connected ? (
                  <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <CheckCircle2 className="size-3.5" /> Connected
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    Not connected
                  </span>
                )}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {item.connected
                  ? `Connected${item.lastSynced ? ` ${timeAgo(item.lastSynced)}` : ""}.`
                  : item.lastSynced
                    ? `Disconnected. Last connected ${timeAgo(item.lastSynced)}.`
                    : "Not connected yet."}
              </p>
            </div>

            <div className="mt-6 flex justify-end border-t border-border/40 pt-4">
              <Button
                onClick={() => {
                  toggleIntegration(item.id);
                  toast.success(`${item.name} ${item.connected ? "disconnected" : "connected"}.`);
                }}
                variant={item.connected ? "outline" : "default"}
                className={
                  item.connected
                    ? "gap-2 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    : "gap-2"
                }
              >
                {item.connected ? (
                  <>
                    <Unlink className="size-4" /> Disconnect
                  </>
                ) : (
                  <>
                    <Link2 className="size-4" /> Connect
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
