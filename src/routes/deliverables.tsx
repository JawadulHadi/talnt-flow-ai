import { createFileRoute } from "@tanstack/react-router";
import { Download, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAtsStore } from "@/stores/ats-store";
import { buildRecommendation } from "@/lib/ats/scoring";
import { exportInterviewGuide, exportJobDescription, exportPackage } from "@/lib/ats/pdf";
import type { JobDescription } from "@/lib/ats/types";

export const Route = createFileRoute("/deliverables")({
  head: () => ({
    meta: [
      { title: "Deliverables — Qeloma Agent for Recruiter" },
      {
        name: "description",
        content: "Edit your job description and interview guide, then export professional PDFs.",
      },
      { property: "og:title", content: "Deliverables — Qeloma Agent for Recruiter" },
      {
        property: "og:description",
        content: "Job description and STAR interview guide workspace with PDF export.",
      },
    ],
  }),
  component: DeliverablesPage,
});

const lines = (v: string) =>
  v
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function DeliverablesPage() {
  const jd = useAtsStore((s) => s.jd);
  const updateJd = useAtsStore((s) => s.updateJd);
  const questions = useAtsStore((s) => s.questions);
  const candidates = useAtsStore((s) => s.candidates);
  const cid = useAtsStore((s) => s.scorecardCandidateId);
  const ratings = useAtsStore((s) => s.ratings);
  const set = (patch: Partial<JobDescription>) => updateJd({ ...jd, ...patch });

  const downloadPackage = () => {
    const c = candidates.find((x) => x.id === cid) ?? candidates[0];
    if (!c) return;
    const r = ratings[c.id] ?? {};
    exportPackage(jd, questions, c, r, buildRecommendation(c.name, questions, r));
    toast.success("Recruitment package downloaded");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Workspace</p>
          <h1 className="text-4xl text-foreground">Deliverables</h1>
          <p className="mt-1 text-muted-foreground">
            Edits save automatically. Export any document as a polished PDF.
          </p>
        </div>
        <Button onClick={downloadPackage}>
          <Package className="size-4" /> Download complete package
        </Button>
      </div>

      <Tabs defaultValue="jd">
        <TabsList>
          <TabsTrigger value="jd">Job description</TabsTrigger>
          <TabsTrigger value="guide">Interview guide</TabsTrigger>
        </TabsList>

        <TabsContent value="jd" className="animate-in fade-in duration-500">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass space-y-3 p-5">
              <label className="block text-sm font-medium">
                Title
                <Input
                  className="mt-1"
                  value={jd.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Location and pay
                <Input
                  className="mt-1"
                  value={jd.meta}
                  onChange={(e) => set({ meta: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Overview
                <Textarea
                  className="mt-1"
                  rows={4}
                  value={jd.overview}
                  onChange={(e) => set({ overview: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Responsibilities (one per line)
                <Textarea
                  className="mt-1"
                  rows={5}
                  value={jd.responsibilities.join("\n")}
                  onChange={(e) => set({ responsibilities: lines(e.target.value) })}
                />
              </label>
              <label className="block text-sm font-medium">
                Requirements (one per line)
                <Textarea
                  className="mt-1"
                  rows={5}
                  value={jd.requirements.join("\n")}
                  onChange={(e) => set({ requirements: lines(e.target.value) })}
                />
              </label>
              <label className="block text-sm font-medium">
                Why join us
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={jd.whyJoinUs}
                  onChange={(e) => set({ whyJoinUs: e.target.value })}
                />
              </label>
            </div>
            <article className="glass space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl text-foreground">{jd.title}</h2>
                  <p className="text-sm text-muted-foreground">{jd.meta}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => exportJobDescription(jd)}>
                  <Download className="size-4" /> PDF
                </Button>
              </div>
              <p className="text-foreground">{jd.overview}</p>
              <div>
                <h3 className="text-lg">Responsibilities</h3>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {jd.responsibilities.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg">Requirements</h3>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {jd.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg">Why join us</h3>
                <p className="text-muted-foreground">{jd.whyJoinUs}</p>
              </div>
            </article>
          </div>
        </TabsContent>

        <TabsContent value="guide" className="animate-in fade-in duration-500">
          <div className="glass p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl">STAR interview guide</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportInterviewGuide(jd, questions)}
              >
                <Download className="size-4" /> PDF
              </Button>
            </div>
            <ol className="grid gap-3 md:grid-cols-2">
              {questions.map((q, i) => (
                <li key={q.id} className="rounded-xl border border-border p-4">
                  <p className="text-xs uppercase tracking-widest text-primary">
                    {i + 1}. {q.competency}
                  </p>
                  <p className="mt-1 text-foreground">{q.question}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <strong>Look for:</strong> {q.lookFor}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Follow-up:</strong> {q.followUp}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
