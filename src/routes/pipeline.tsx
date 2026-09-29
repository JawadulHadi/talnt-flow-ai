import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, GripVertical, MessageSquare, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CandidateDrawer } from "@/components/candidate-drawer";
import { useAtsStore } from "@/stores/ats-store";
import { STAGES, type Stage } from "@/lib/ats/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Candidate pipeline — Qeloma Agent for Recruiter" },
      { name: "description", content: "Drag candidates through Sourced, Screened, Interviewing, Offer sent and Hired." },
      { property: "og:title", content: "Candidate pipeline — Qeloma Agent for Recruiter" },
      { property: "og:description", content: "Drag-and-drop ATS pipeline with team comments and automated emails." },
    ],
  }),
  component: PipelinePage,
});

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2);
}

function PipelinePage() {
  const candidates = useAtsStore((s) => s.candidates);
  const moveStage = useAtsStore((s) => s.moveStage);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  const q = query.toLowerCase();
  const visible = candidates.filter((c) => !q || c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q));

  const drop = (stage: Stage, id: string) => {
    const c = candidates.find((x) => x.id === id);
    setDragOver(null);
    if (!c || c.stage === stage) return;
    moveStage(id, stage);
    toast.success(`${c.name} moved to ${stage}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Recruiter workflow</p>
          <h1 className="text-4xl text-foreground">Pipeline</h1>
          <p className="mt-1 text-muted-foreground">Drag cards between stages, or use the arrow to promote quickly.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search candidates or roles" className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-5">
        {STAGES.map((stage, si) => {
          const list = visible.filter((c) => c.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setDragOver(stage); }}
              onDragLeave={() => setDragOver((s) => (s === stage ? null : s))}
              onDrop={(e) => drop(stage, e.dataTransfer.getData("text/plain"))}
              className={cn("glass min-h-80 min-w-56 p-3 transition-all duration-300", dragOver === stage && "ring-2 ring-primary scale-[1.01]")}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-sans text-sm font-semibold text-foreground">{stage}</h2>
                <span className="rounded-full bg-secondary px-2 text-xs text-secondary-foreground">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                    onClick={() => setOpenId(c.id)}
                    className="group cursor-grab rounded-xl border border-border bg-background/40 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 active:cursor-grabbing animate-in fade-in zoom-in-95"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials(c.name)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.role}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{c.matchScore}% · {c.source}</span>
                      <span className="flex items-center gap-2">
                        {c.comments.length > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="size-3" />{c.comments.length}</span>}
                        {si < STAGES.length - 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6"
                            aria-label={`Promote to ${STAGES[si + 1]}`}
                            onClick={(e) => { e.stopPropagation(); drop(STAGES[si + 1]!, c.id); }}
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                {list.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">Drop a candidate here</p>}
              </div>
            </div>
          );
        })}
      </div>
      <CandidateDrawer candidateId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
