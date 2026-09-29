import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarInput } from "@/components/candidate-drawer";
import { useAtsStore } from "@/stores/ats-store";
import { useUiStore } from "@/stores/ui-store";
import { buildRecommendation } from "@/lib/ats/scoring";
import { evaluateScorecard } from "@/lib/ats/ai-service";
import { exportScorecard } from "@/lib/ats/pdf";
import type { Recommendation } from "@/lib/ats/types";

export const Route = createFileRoute("/scorecard")({
  head: () => ({
    meta: [
      { title: "Candidate scorecard — Qeloma Agent for Recruiter" },
      { name: "description", content: "Rate 10 STAR behavioural questions and get a weighted hiring recommendation." },
      { property: "og:title", content: "Candidate scorecard — Qeloma Agent for Recruiter" },
      { property: "og:description", content: "STAR competency ratings with a weighted hiring recommendation." },
    ],
  }),
  component: ScorecardPage,
});

function ScorecardPage() {
  const candidates = useAtsStore((s) => s.candidates);
  const questions = useAtsStore((s) => s.questions);
  const cid = useAtsStore((s) => s.scorecardCandidateId);
  const setCid = useAtsStore((s) => s.setScorecardCandidate);
  const allRatings = useAtsStore((s) => s.ratings);
  const setRating = useAtsStore((s) => s.setRating);
  const setFallback = useUiStore((s) => s.setFallback);
  const [busy, setBusy] = useState(false);
  const [agentRec, setAgentRec] = useState<Recommendation | null>(null);

  const candidate = candidates.find((c) => c.id === cid) ?? candidates[0];
  if (!candidate) return <p className="text-muted-foreground">No candidates yet.</p>;
  const ratings = allRatings[candidate.id] ?? {};
  const live = buildRecommendation(candidate.name, questions, ratings);
  const rec = agentRec ?? live;
  const rated = questions.filter((q) => (ratings[q.id]?.score ?? 0) > 0).length;

  const runAgent = async () => {
    setBusy(true);
    const res = await evaluateScorecard(candidate.name, questions, ratings);
    setFallback(res.fallback);
    setAgentRec(res.data);
    setBusy(false);
    toast.success(res.fallback ? "Recommendation calculated locally" : "Qeloma Agent recommendation ready");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Structured evaluation</p>
          <h1 className="text-4xl text-foreground">Candidate scorecard</h1>
          <p className="mt-1 text-muted-foreground">{rated} of {questions.length} questions rated</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={candidate.id} onValueChange={(v) => { setCid(v); setAgentRec(null); }}>
            <SelectTrigger className="w-56" aria-label="Candidate"><SelectValue /></SelectTrigger>
            <SelectContent>
              {candidates.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.stage}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportScorecard(candidate, questions, ratings, rec)}>
            <Download className="size-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <ol className="space-y-3">
          {questions.map((q, i) => {
            const r = ratings[q.id] ?? { score: 0, note: "" };
            return (
              <li key={q.id} className="glass p-4 animate-in fade-in slide-in-from-bottom-1" >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-widest text-primary">{i + 1}. {q.competency} · weight {q.weight.toFixed(1).replace(".", ",")}</p>
                    <p className="mt-1 text-foreground">{q.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Look for: {q.lookFor}</p>
                  </div>
                  <StarInput value={r.score} onChange={(v) => { setRating(candidate.id, q.id, { score: v }); setAgentRec(null); }} label={`Rating for ${q.competency}`} />
                </div>
                <Input
                  className="mt-3"
                  value={r.note}
                  onChange={(e) => { setRating(candidate.id, q.id, { note: e.target.value }); setAgentRec(null); }}
                  placeholder="Evidence from the STAR answer (situation, task, action, result)"
                />
              </li>
            );
          })}
        </ol>

        <aside className="glass sticky top-24 h-fit space-y-4 p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Weighted recommendation</p>
          <div className="flex items-end gap-3">
            <span key={rec.weightedScore} className="font-display text-6xl text-foreground animate-in zoom-in-95 fade-in">{rec.weightedScore}</span>
            <span className="pb-2 text-muted-foreground">/ 100</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${rec.weightedScore}%` }} />
          </div>
          <p className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">{rec.verdict}</p>
          <p className="text-sm text-muted-foreground">{rec.executiveSummary}</p>
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground">Key strengths</h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">{rec.keyStrengths.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground">Areas to probe</h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">{rec.areasToProbe.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <Button className="w-full" onClick={runAgent} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Ask Qeloma Agent for Recruiter
          </Button>
          <p className="text-xs text-muted-foreground">Source: {rec.generatedBy === "ai" ? "Qeloma Agent" : "local weighted engine"}</p>
        </aside>
      </div>
    </div>
  );
}
