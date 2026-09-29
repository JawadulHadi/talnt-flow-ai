import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Sparkles, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddCandidateDialog } from "@/components/add-candidate-dialog";
import { useAtsStore } from "@/stores/ats-store";
import { formatDate, isOpenApplication } from "@/lib/ats/analytics";
import type { JobStatus } from "@/lib/ats/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs — TalntFlow AI" },
      {
        name: "description",
        content: "Open, publish and close job requisitions and add candidates to them.",
      },
      { property: "og:title", content: "Jobs — TalntFlow AI" },
    ],
  }),
  component: JobsPage,
});

const DEPARTMENTS = ["Engineering", "Design", "Product", "Growth", "Talent"];

const statusStyle: Record<JobStatus, string> = {
  Active: "border-primary/30 bg-primary/10 text-primary",
  Draft: "border-border bg-secondary text-secondary-foreground",
  Closed: "border-border bg-muted text-muted-foreground",
};

const nextStatus: Record<JobStatus, { to: JobStatus; label: string }> = {
  Draft: { to: "Active", label: "Publish" },
  Active: { to: "Closed", label: "Close" },
  Closed: { to: "Active", label: "Reopen" },
};

function JobsPage() {
  const jobs = useAtsStore((s) => s.jobs);
  const candidates = useAtsStore((s) => s.candidates);
  const setJobStatus = useAtsStore((s) => s.setJobStatus);

  const [query, setQuery] = useState("");
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidateJobId, setCandidateJobId] = useState<string | undefined>();

  const openByJob = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of candidates) {
      if (isOpenApplication(c)) counts.set(c.jobId, (counts.get(c.jobId) ?? 0) + 1);
    }
    return counts;
  }, [candidates]);

  const q = query.trim().toLowerCase();
  const filteredJobs = jobs.filter(
    (j) => !q || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q),
  );
  const activeCount = filteredJobs.filter((j) => j.status === "Active").length;

  const openCandidateModal = (jobId?: string) => {
    setCandidateJobId(jobId);
    setCandidateModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Requisitions</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open requisitions, track applicants per job, and add candidates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => openCandidateModal()} variant="outline" className="gap-2">
            <UserPlus className="size-4" /> Add candidate
          </Button>
          <Button onClick={() => setJobModalOpen(true)} className="gap-2">
            <Plus className="size-4" /> New job
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search job titles or departments…"
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredJobs.length}</span>{" "}
          {filteredJobs.length === 1 ? "job" : "jobs"} ·{" "}
          <span className="font-bold text-foreground">{activeCount}</span> active
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => {
          const applicants = openByJob.get(job.id) ?? 0;
          const next = nextStatus[job.status];
          return (
            <div
              key={job.id}
              className="glass group flex flex-col justify-between p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {job.department}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      statusStyle[job.status],
                    )}
                  >
                    {job.status}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-foreground">{job.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {job.location} · {job.salary}
                </p>
              </div>

              <div className="mt-6 space-y-3 border-t border-border/40 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <Link
                    to="/pipeline"
                    search={{ job: job.id }}
                    className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
                  >
                    <Users className="size-4 text-primary" /> {applicants} active{" "}
                    {applicants === 1 ? "applicant" : "applicants"}
                  </Link>
                  <span>Posted {formatDate(job.postedDate)}</span>
                </div>
                <div className="flex justify-end gap-2">
                  {job.status === "Active" && (
                    <Button size="sm" variant="ghost" onClick={() => openCandidateModal(job.id)}>
                      <UserPlus className="size-3.5" /> Add candidate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setJobStatus(job.id, next.to);
                      toast.success(`${job.title} is now ${next.to.toLowerCase()}.`);
                    }}
                  >
                    {next.label}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredJobs.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No jobs match “{query}”.
          </p>
        )}
      </div>

      <Dialog open={jobModalOpen} onOpenChange={setJobModalOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="size-5 text-primary" /> New job
            </DialogTitle>
            <DialogDescription>
              Save as a draft, or publish it as active to start accepting candidates.
            </DialogDescription>
          </DialogHeader>
          <JobForm onDone={() => setJobModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <AddCandidateDialog
        open={candidateModalOpen}
        onOpenChange={setCandidateModalOpen}
        defaultJobId={candidateJobId}
      />
    </div>
  );
}

function JobForm({ onDone }: { onDone: () => void }) {
  const addJob = useAtsStore((s) => s.addJob);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("Remote");
  const [salary, setSalary] = useState("");
  const [status, setStatus] = useState<JobStatus>("Active");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = { title: title.trim(), location: location.trim(), salary: salary.trim() };
    if (!clean.title) return void toast.error("Enter a job title.");
    addJob({
      ...clean,
      location: clean.location || "Remote",
      salary: clean.salary || "Not disclosed",
      department,
      status,
    });
    toast.success(`${clean.title} saved as ${status.toLowerCase()}.`);
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="title">Job title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Backend Engineer"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dept">Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="dept">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Remote / Hybrid (City)"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="salary">Salary range</Label>
          <Input
            id="salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="e.g. €90k – €110k"
          />
        </div>
      </div>
      <DialogFooter className="pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Save job</Button>
      </DialogFooter>
    </form>
  );
}
