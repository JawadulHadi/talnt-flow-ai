import { useState } from "react";
import { FileUp, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtsStore, type AddCandidateResult, type NewCandidateInput } from "@/stores/ats-store";
import { EMAIL_RE, nameFromFileName } from "@/lib/ats/candidate-input";
import { GENDERS, SOURCES, type Gender, type Source } from "@/lib/ats/types";

const errors: Record<Extract<AddCandidateResult, { ok: false }>["error"], string> = {
  "job-not-found": "That job no longer exists.",
  "job-not-open": "That job isn't open for applications.",
  duplicate: "This email has already applied to that job.",
};

export function AddCandidateDialog({
  open,
  onOpenChange,
  defaultJobId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultJobId?: string | undefined;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="size-5 text-primary" /> Add candidate
          </DialogTitle>
          <DialogDescription>
            New candidates start in Sourced and get an application confirmation email.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every open starts from a clean form. */}
        <CandidateForm defaultJobId={defaultJobId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CandidateForm({
  defaultJobId,
  onDone,
}: {
  defaultJobId?: string | undefined;
  onDone: () => void;
}) {
  const jobs = useAtsStore((s) => s.jobs);
  const addCandidate = useAtsStore((s) => s.addCandidate);
  const openJobs = jobs.filter((j) => j.status === "Active");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobId, setJobId] = useState(
    openJobs.find((j) => j.id === defaultJobId)?.id ?? openJobs[0]?.id ?? "",
  );
  const [source, setSource] = useState<Source>("LinkedIn");
  const [score, setScore] = useState("70");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [gender, setGender] = useState<Gender | "undisclosed">("undisclosed");
  const [urg, setUrg] = useState<"undisclosed" | "yes" | "no">("undisclosed");
  const [resumeFileName, setResumeFileName] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const matchScore = Number(score);
    if (!cleanName) return void toast.error("Enter the candidate's name.");
    if (!EMAIL_RE.test(cleanEmail)) return void toast.error("Enter a valid email address.");
    if (!jobId) return void toast.error("Open a job first — candidates apply to an active job.");
    if (!Number.isFinite(matchScore) || matchScore < 0 || matchScore > 100) {
      return void toast.error("Screening score must be between 0 and 100.");
    }
    const opt = (key: string, v: string) => (v.trim() ? { [key]: v.trim() } : {});
    const input: NewCandidateInput = {
      jobId,
      name: cleanName,
      email: cleanEmail,
      source,
      matchScore,
      ...opt("phone", phone),
      ...opt("location", location),
      ...opt("linkedin", linkedin),
      ...opt("resumeFileName", resumeFileName),
      ...(gender !== "undisclosed" ? { gender } : {}),
      ...(urg !== "undisclosed" ? { underrepresented: urg === "yes" } : {}),
    };
    const res = addCandidate(input);
    if (!res.ok) return void toast.error(errors[res.error]);
    toast.success(`${cleanName} added to ${jobs.find((j) => j.id === jobId)?.title}.`);
    onDone();
  };

  if (openJobs.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        There are no active jobs. Publish a job on the Jobs page before adding candidates.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 py-2">
      <label className="block cursor-pointer rounded-xl border border-dashed border-border bg-background/40 p-4 text-center">
        <FileUp className="mx-auto size-7 text-primary" />
        <span className="mt-2 block text-xs font-semibold text-foreground">
          {resumeFileName || "Attach résumé (PDF or DOCX, optional)"}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          The file name is kept for reference and pre-fills an empty name field.
        </span>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setResumeFileName(f.name);
            if (!name.trim()) setName(nameFromFileName(f.name));
          }}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cname" label="Full name">
          <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field id="cemail" label="Email">
          <Input
            id="cemail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cjob" label="Job">
          <Select value={jobId} onValueChange={setJobId}>
            <SelectTrigger id="cjob">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {openJobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="csource" label="Source">
          <Select value={source} onValueChange={(v) => setSource(v as Source)}>
            <SelectTrigger id="csource">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="cscore" label="Screening score">
          <Input
            id="cscore"
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </Field>
        <Field id="cphone" label="Phone (optional)">
          <Input id="cphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field id="cloc" label="Location (optional)">
          <Input id="cloc" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
      </div>

      <Field id="clinkedin" label="LinkedIn URL (optional)">
        <Input
          id="clinkedin"
          type="url"
          placeholder="https://linkedin.com/in/…"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
        />
      </Field>

      <fieldset className="space-y-3 rounded-xl border border-border p-3">
        <legend className="px-1 text-xs font-semibold text-foreground">
          Voluntary self-identification
        </legend>
        <p className="text-[11px] text-muted-foreground">
          Only record what the candidate chose to share. Used for aggregate diversity reporting,
          never shown to the AI agent.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cgender" label="Gender">
            <Select value={gender} onValueChange={(v) => setGender(v as Gender | "undisclosed")}>
              <SelectTrigger id="cgender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="undisclosed">Not disclosed</SelectItem>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="curg" label="Under-represented group">
            <Select value={urg} onValueChange={(v) => setUrg(v as typeof urg)}>
              <SelectTrigger id="curg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="undisclosed">Not disclosed</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </fieldset>

      <DialogFooter className="pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Add candidate</Button>
      </DialogFooter>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
