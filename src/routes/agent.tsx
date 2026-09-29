import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Check, ListChecks, Loader2, Play, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAtsStore } from "@/stores/ats-store";
import { useUiStore } from "@/stores/ui-store";
import { runAgent } from "@/lib/ats/ai-service";
import { AGENT_LIMITS, type AgentProposal, type AgentRun } from "@/lib/ats/agent";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "Agent — TalntFlow AI" },
      {
        name: "description",
        content:
          "An AI recruiting agent that reviews the pipeline and proposes next steps for your approval.",
      },
      { property: "og:title", content: "Agent — TalntFlow AI" },
    ],
  }),
  component: AgentPage,
});

const PRESETS = [
  "Triage the whole pipeline and propose the next step for anyone who is stuck.",
  "Which candidates in Interviewing need a reminder this week?",
  "Review the Senior Product Designer pipeline and flag anyone at risk of dropping out.",
];

function describe(p: AgentProposal): string {
  switch (p.kind) {
    case "move":
      return `Move to ${p.toStage}`;
    case "email":
      return `Send ${p.template} email`;
    case "note":
      return `Add note: “${p.note}”`;
  }
}

type Decision = "applied" | "dismissed" | "skipped";

function AgentPage() {
  const setFallback = useUiStore((s) => s.setFallback);
  const moveStage = useAtsStore((s) => s.moveStage);
  const sendEmail = useAtsStore((s) => s.sendEmail);
  const addComment = useAtsStore((s) => s.addComment);
  const [task, setTask] = useState(PRESETS[0]!);
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<AgentRun | null>(null);
  const [decided, setDecided] = useState<Record<string, Decision>>({});

  const start = async () => {
    const t = task.trim();
    if (!t) return;
    setBusy(true);
    setRun(null);
    setDecided({});
    const { candidates, jobs, ratings, questions } = useAtsStore.getState();
    const res = await runAgent(t, { candidates, jobs, ratings, questions });
    setFallback(res.fallback);
    setRun(res.data);
    setBusy(false);
  };

  const decide = (id: string, d: Decision) => setDecided((cur) => ({ ...cur, [id]: d }));

  const apply = (p: AgentProposal) => {
    const c = useAtsStore.getState().candidates.find((x) => x.id === p.candidateId);
    if (!c || c.rejection) {
      toast.error(`${p.candidateName} can no longer be updated.`);
      return decide(p.id, "skipped");
    }
    if (p.kind === "move") moveStage(c.id, p.toStage);
    if (p.kind === "email") sendEmail(c.id, p.template);
    if (p.kind === "note") {
      addComment(c.id, p.note, 0, { author: "TalntFlow Agent", role: "AI note, approved by you" });
    }
    decide(p.id, "applied");
  };

  const pending = run?.proposals.filter((p) => !decided[p.id]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Autonomous assistant</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">TalntFlow Agent</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The agent works in a loop: it reads the pipeline through tools, decides what to look at
            next, and ends with proposals. Nothing changes until you approve it.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="glass space-y-4 p-5">
          <Textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={3}
            maxLength={AGENT_LIMITS.taskChars}
            placeholder="What should the agent do?"
            aria-label="Agent task"
          />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTask(p)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>
          <Button onClick={start} disabled={busy || !task.trim()} className="gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {busy ? "Reviewing the pipeline…" : "Run agent"}
          </Button>
          {busy && (
            <p className="text-xs text-muted-foreground">
              With Claude connected a run takes up to a minute while the agent calls its tools.
            </p>
          )}
        </section>

        <aside className="glass space-y-3 p-5 text-sm">
          <h2 className="flex items-center gap-2 text-base text-foreground">
            <ShieldCheck className="size-4 text-primary" /> Guardrails
          </h2>
          <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground">
            <li>Read-only tools; stage moves, emails and notes are proposals you approve.</li>
            <li>It can't reject candidates. It flags concerns in a note instead.</li>
            <li>Contact details and diversity data are never sent to the model.</li>
            <li>
              At most {AGENT_LIMITS.proposals} proposals and 8 reasoning steps per run. Without
              Claude, fixed triage rules run locally.
            </li>
          </ul>
        </aside>
      </div>

      {run && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] animate-in fade-in">
          <section className="glass space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg text-foreground">
                <Bot className="size-5 text-primary" /> Proposals ({run.proposals.length})
              </h2>
              {pending.length > 1 && (
                <Button size="sm" variant="outline" onClick={() => pending.forEach(apply)}>
                  <Check className="size-4" /> Approve all {pending.length}
                </Button>
              )}
            </div>
            <p className="whitespace-pre-line text-sm text-foreground">{run.summary}</p>
            {run.proposals.length === 0 && (
              <p className="text-sm text-muted-foreground">No actions proposed.</p>
            )}
            <ul className="space-y-2">
              {run.proposals.map((p) => {
                const d = decided[p.id];
                return (
                  <li
                    key={p.id}
                    className={cn(
                      "flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-3",
                      d && "opacity-60",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {p.candidateName}{" "}
                        <span className="font-normal text-primary">· {describe(p)}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.rationale}</p>
                    </div>
                    {d ? (
                      <span className="text-xs font-medium capitalize text-muted-foreground">
                        {d}
                      </span>
                    ) : (
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => apply(p)}>
                          <Check className="size-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Dismiss"
                          onClick={() => decide(p.id, "dismissed")}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="glass h-fit space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-base text-foreground">
              <ListChecks className="size-4 text-primary" /> Tool calls ({run.steps.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Engine: {run.generatedBy === "ai" ? "Claude Opus 5.5" : "local triage rules"}
            </p>
            <ol className="space-y-1.5 border-l border-border pl-3 text-xs">
              {run.steps.map((s, i) => (
                <li key={i} className="text-muted-foreground">
                  <span className="font-mono text-foreground">{s.tool}</span>
                  {s.detail && <span> · {s.detail}</span>}
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
    </div>
  );
}
