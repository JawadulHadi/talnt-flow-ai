import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, FileUp, Plus, Search, Sparkles, UserPlus, Users } from "lucide-react";
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
import { useAtsStore } from "@/stores/ats-store";
import type { Stage, Source } from "@/lib/ats/types";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Job Postings & Positions — TalntFlow AI" },
      {
        name: "description",
        content:
          "Manage job openings, post new positions, and add candidates via resume upload or manual entry.",
      },
      { property: "og:title", content: "Job Postings & Positions — TalntFlow AI" },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const jobs = useAtsStore((s) => s.jobs);
  const addJob = useAtsStore((s) => s.addJob);
  const addCandidate = useAtsStore((s) => s.addCandidate);

  const [query, setQuery] = useState("");
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);

  // New Job Form
  const [newTitle, setNewTitle] = useState("");
  const [newDept, setNewDept] = useState("Engineering");
  const [newLocation, setNewLocation] = useState("Remote (Global)");
  const [newSalary, setNewSalary] = useState("€120k – €150k");

  // New Candidate Form
  const [candName, setCandName] = useState("");
  const [candRole, setCandRole] = useState(jobs[0]?.title ?? "Senior Product Designer");
  const [candEmail, setCandEmail] = useState("");
  const [candSource, setCandSource] = useState<Source>("LinkedIn");
  const [candStage, setCandStage] = useState<Stage>("Sourced");
  const [candMatch, setCandMatch] = useState(88);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const filteredJobs = jobs.filter(
    (j) =>
      !query ||
      j.title.toLowerCase().includes(query.toLowerCase()) ||
      j.department.toLowerCase().includes(query.toLowerCase()),
  );

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a job title");
      return;
    }
    addJob({
      title: newTitle,
      department: newDept,
      location: newLocation,
      salary: newSalary,
      status: "Active",
    });
    toast.success(`Job "${newTitle}" posted successfully!`);
    setNewTitle("");
    setJobModalOpen(false);
  };

  const handleCreateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim() || !candEmail.trim()) {
      toast.error("Please fill in candidate name and email");
      return;
    }
    addCandidate({
      name: candName,
      role: candRole,
      stage: candStage,
      matchScore: candMatch,
      appliedDate: new Date().toISOString(),
      source: candSource,
      sourcingCost: candSource === "LinkedIn" ? 1200 : candSource === "Referral" ? 2500 : 500,
      email: candEmail,
      phone: "+1 555 019 2834",
      gender: "Woman",
      underrepresented: true,
      location: "Global",
      socials: {
        linkedin: `https://linkedin.com/in/${candName.toLowerCase().replace(/\s+/g, "-")}`,
      },
      skills: [
        { name: "Systemic thinking", score: candMatch },
        { name: "Execution", score: candMatch - 4 },
      ],
    });
    toast.success(`Candidate ${candName} added successfully!`);
    setCandName("");
    setCandEmail("");
    setCandidateModalOpen(false);
    setResumeFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Recruiting workspace</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Job Openings & Positions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage open requisitions, post across integrated job boards, and ingest
            candidate resumes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setCandidateModalOpen(true)}
            variant="outline"
            className="gap-2 bg-card/60 backdrop-blur-md"
          >
            <UserPlus className="size-4" /> Add Candidate
          </Button>
          <Button
            onClick={() => setJobModalOpen(true)}
            className="gap-2 bg-primary text-primary-foreground shadow-lg"
          >
            <Plus className="size-4" /> Post New Job
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search job titles or departments..."
            className="pl-9 bg-card/60 backdrop-blur-md border-border"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredJobs.length}</span> active
          positions
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="glass group flex flex-col justify-between rounded-2xl border border-border/70 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {job.department}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    job.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {job.status}
                </span>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {job.location} · {job.salary}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Users className="size-4 text-primary" /> {job.applicantsCount} active applicants
              </span>
              <span>Posted {job.postedDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Post New Job Modal */}
      <Dialog open={jobModalOpen} onOpenChange={setJobModalOpen}>
        <DialogContent className="glass sm:max-w-md border-border bg-card/90 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="size-5 text-primary" /> Post New Job Opening
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Publish a new position across your integrated job boards (LinkedIn, Indeed, Google
              Jobs) instantly.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateJob} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dept">Department</Label>
                <Select value={newDept} onValueChange={setNewDept}>
                  <SelectTrigger id="dept">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Growth">Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Remote / Hybrid"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary Range</Label>
              <Input
                id="salary"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                placeholder="e.g. $140k – $180k"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setJobModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                Publish Opening
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Candidate Modal (Resume upload or Manual entry) */}
      <Dialog open={candidateModalOpen} onOpenChange={setCandidateModalOpen}>
        <DialogContent className="glass sm:max-w-lg border-border bg-card/90 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <UserPlus className="size-5 text-primary" /> Add Candidate (Resume or Manual)
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upload a candidate resume for instant AI parsing, or enter details manually.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCandidate} className="space-y-4 py-2">
            {/* Resume Upload Box */}
            <div className="rounded-xl border border-dashed border-border/80 bg-background/40 p-4 text-center">
              <FileUp className="mx-auto size-8 text-primary" />
              <p className="mt-2 text-xs font-semibold text-foreground">
                {resumeFile ? resumeFile.name : "Drag & drop resume PDF/DOCX or click to browse"}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                AI will auto-extract skills, contact info & match score
              </p>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                className="mt-2 text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setResumeFile(f);
                    setCandName(f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
                    setCandEmail(`${f.name.toLowerCase().split(".")[0]}@candidate.ai`);
                    setCandMatch(92);
                    toast.success("Resume parsed successfully by AI agent!");
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cname">Full Name</Label>
                <Input
                  id="cname"
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cemail">Email Address</Label>
                <Input
                  id="cemail"
                  type="email"
                  value={candEmail}
                  onChange={(e) => setCandEmail(e.target.value)}
                  placeholder="elena@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crole">Applying Role</Label>
                <Select value={candRole} onValueChange={setCandRole}>
                  <SelectTrigger id="crole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={j.title}>
                        {j.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="csource">Source Job Board</Label>
                <Select value={candSource} onValueChange={(v) => setCandSource(v as Source)}>
                  <SelectTrigger id="csource">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Inbound">Inbound</SelectItem>
                    <SelectItem value="Agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cstage">Pipeline Stage</Label>
                <Select value={candStage} onValueChange={(v) => setCandStage(v as Stage)}>
                  <SelectTrigger id="cstage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sourced">Sourced</SelectItem>
                    <SelectItem value="Screened">Screened</SelectItem>
                    <SelectItem value="Interviewing">Interviewing</SelectItem>
                    <SelectItem value="Offer Sent">Offer Sent</SelectItem>
                    <SelectItem value="Hired">Hired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmatch">AI Match Score (%)</Label>
                <Input
                  id="cmatch"
                  type="number"
                  min="50"
                  max="100"
                  value={candMatch}
                  onChange={(e) => setCandMatch(Number(e.target.value))}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setCandidateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                Add Candidate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
