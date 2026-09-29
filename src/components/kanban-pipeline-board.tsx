import { useState } from "react";
import {
  ChevronRight,
  GripVertical,
  MessageSquare,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddCandidateDialog } from "@/components/add-candidate-dialog";
import { CandidateDrawer } from "@/components/candidate-drawer";
import { useAtsStore } from "@/stores/ats-store";
import type { Candidate, Stage } from "@/lib/ats/types";
import { cn } from "@/lib/utils";

interface KanbanColumn {
  id: string;
  title: string;
  stages: Stage[];
  defaultStage: Stage;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "applied", title: "Applied / Sourced", stages: ["Sourced"], defaultStage: "Sourced" },
  { id: "screened", title: "Screened", stages: ["Screened"], defaultStage: "Screened" },
  {
    id: "interviewing",
    title: "Interviewing",
    stages: ["Interviewing"],
    defaultStage: "Interviewing",
  },
  { id: "offer", title: "Offer", stages: ["Offer Sent"], defaultStage: "Offer Sent" },
  { id: "hired", title: "Hired", stages: ["Hired"], defaultStage: "Hired" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

export function KanbanPipelineBoard({
  jobId,
  onJobChange,
}: {
  jobId?: string | undefined;
  onJobChange: (jobId: string | undefined) => void;
}) {
  const candidates = useAtsStore((s) => s.candidates);
  const jobs = useAtsStore((s) => s.jobs);
  const moveStage = useAtsStore((s) => s.moveStage);
  const [query, setQuery] = useState("");
  const [showRejected, setShowRejected] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const inJob = candidates.filter((c) => !jobId || c.jobId === jobId);
  const rejectedCount = inJob.filter((c) => c.rejection).length;
  const visible = inJob.filter(
    (c) =>
      (showRejected || !c.rejection) &&
      (!q || c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)),
  );

  const handleDrop = (targetStage: Stage, candidateId: string) => {
    setDragOverColumn(null);
    const c = candidates.find((x) => x.id === candidateId);
    if (!c || c.stage === targetStage) return;
    if (c.rejection) {
      toast.error(`${c.name} was rejected. Reactivate them from their profile first.`);
      return;
    }
    moveStage(candidateId, targetStage);
    toast.success(`${c.name} moved to ${targetStage}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> Candidate pipeline
            </span>
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            TalntFlow Pipeline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag cards between stages, or open a candidate to review, email or reject.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <UserPlus className="size-4" /> Add candidate
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates or roles…"
            className="pl-9"
          />
        </div>
        <Select
          value={jobId ?? "all"}
          onValueChange={(v) => onJobChange(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-64" aria-label="Filter by job">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All jobs</SelectItem>
            {jobs.map((j) => (
              <SelectItem key={j.id} value={j.id}>
                {j.title}
                {j.status !== "Active" ? ` (${j.status.toLowerCase()})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showRejected} onCheckedChange={setShowRejected} />
          Show rejected ({rejectedCount})
        </label>
      </div>

      <div className="grid gap-4 overflow-x-auto pb-4 md:grid-cols-5">
        {KANBAN_COLUMNS.map((col, colIndex) => {
          const list = visible.filter((c) => col.stages.includes(c.stage));
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(col.id);
              }}
              onDragLeave={() => setDragOverColumn((cur) => (cur === col.id ? null : cur))}
              onDrop={(e) => {
                const candidateId = e.dataTransfer.getData("text/plain");
                if (candidateId) {
                  handleDrop(col.defaultStage, candidateId);
                }
              }}
              className={cn(
                "glass flex flex-col min-h-[500px] min-w-[260px] rounded-2xl p-4 transition-all duration-300 border border-border/60 bg-card/40 backdrop-blur-xl shadow-lg",
                dragOverColumn === col.id && "ring-2 ring-primary scale-[1.01] bg-primary/5",
              )}
            >
              <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-sans text-sm font-semibold text-foreground">{col.title}</h2>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {list.length}
                  </span>
                </div>
                {colIndex === 4 && <UserCheck className="size-4 text-primary" />}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {list.map((c) => {
                  const rejected = Boolean(c.rejection);
                  const nextStage = rejected
                    ? undefined
                    : KANBAN_COLUMNS[colIndex + 1]?.defaultStage;
                  return (
                    <div
                      key={c.id}
                      draggable={!rejected}
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                      onClick={() => setOpenId(c.id)}
                      className={cn(
                        "group cursor-grab rounded-xl border border-border/80 bg-background/60 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/80 hover:shadow-md active:cursor-grabbing animate-in fade-in zoom-in-95 backdrop-blur-md",
                        rejected && "cursor-pointer opacity-60",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          {initials(c.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.role}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                        {rejected ? (
                          <span className="rounded-full border border-destructive/40 px-2 py-0.5 font-medium text-destructive">
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-primary">
                            <Sparkles className="size-3" /> {c.matchScore}% match
                          </span>
                        )}
                        <span className="flex items-center gap-2">
                          {c.comments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-muted-foreground">
                              <MessageSquare className="size-3" />
                              {c.comments.length}
                            </span>
                          )}
                          {nextStage && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-6 rounded-full hover:bg-primary/20 hover:text-primary"
                              aria-label={`Advance to ${nextStage}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDrop(nextStage, c.id);
                              }}
                            >
                              <ChevronRight className="size-4" />
                            </Button>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {list.length === 0 && (
                  <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                    <p>No candidates in this stage</p>
                    <p className="mt-1 opacity-75">Drag or promote cards here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <CandidateDrawer candidateId={openId} onClose={() => setOpenId(null)} />
      <AddCandidateDialog open={addOpen} onOpenChange={setAddOpen} defaultJobId={jobId} />
    </div>
  );
}
