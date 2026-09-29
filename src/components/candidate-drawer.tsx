import { useState } from "react";
import { FileText, Github, Globe, Linkedin, Mail, Star, Trash2, Undo2, UserX } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtsStore } from "@/stores/ats-store";
import { formatDate } from "@/lib/ats/analytics";
import {
  REJECTION_REASONS,
  STAGES,
  type EmailTemplate,
  type RejectionReason,
} from "@/lib/ats/types";
import { cn } from "@/lib/utils";

const templates: { id: EmailTemplate; label: string }[] = [
  { id: "confirm", label: "Application confirmation" },
  { id: "reminder", label: "Interview reminder" },
  { id: "feedback", label: "Feedback update" },
  { id: "offer", label: "Offer letter" },
];

export function StarInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex gap-0.5" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-125"
        >
          <Star
            className={cn(
              "size-5",
              n <= value ? "fill-accent text-accent" : "text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function CandidateDrawer({
  candidateId,
  onClose,
}: {
  candidateId: string | null;
  onClose: () => void;
}) {
  const candidate = useAtsStore((s) => s.candidates.find((c) => c.id === candidateId));
  const moveStage = useAtsStore((s) => s.moveStage);
  const addComment = useAtsStore((s) => s.addComment);
  const sendEmail = useAtsStore((s) => s.sendEmail);
  const rejectCandidate = useAtsStore((s) => s.rejectCandidate);
  const reactivateCandidate = useAtsStore((s) => s.reactivateCandidate);
  const deleteCandidate = useAtsStore((s) => s.deleteCandidate);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(4);
  const [reason, setReason] = useState<RejectionReason>(REJECTION_REASONS[0]);

  return (
    <Sheet open={!!candidate} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-border bg-popover sm:max-w-xl">
        {candidate && (
          <>
            <SheetHeader>
              <SheetTitle className="font-display text-2xl">{candidate.name}</SheetTitle>
              <SheetDescription>
                {[
                  candidate.role,
                  candidate.location,
                  `applied ${formatDate(candidate.appliedDate)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </SheetDescription>
            </SheetHeader>
            {candidate.rejection ? (
              <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <span>
                  <strong>Rejected</strong> at {candidate.stage} · {candidate.rejection.reason} ·{" "}
                  {formatDate(candidate.rejection.at)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    reactivateCandidate(candidate.id);
                    toast.success(`${candidate.name} is back in the pipeline`);
                  }}
                >
                  <Undo2 className="size-4" /> Reactivate
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-3 px-4">
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={candidate.stage === s ? "default" : "outline"}
                      onClick={() => {
                        moveStage(candidate.id, s);
                        toast.success(`${candidate.name} moved to ${s}`);
                      }}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={reason} onValueChange={(v) => setReason(v as RejectionReason)}>
                    <SelectTrigger className="h-8 w-48" aria-label="Rejection reason">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REJECTION_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      rejectCandidate(candidate.id, reason);
                      toast.success(`${candidate.name} rejected — rejection email logged`);
                    }}
                  >
                    <UserX className="size-4" /> Reject
                  </Button>
                </div>
              </div>
            )}
            <Tabs defaultValue="profile" className="mt-4 px-4 pb-6">
              <TabsList className="w-full">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="comments">Team ({candidate.comments.length})</TabsTrigger>
                <TabsTrigger value="comms">Emails ({candidate.communications.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-5 pt-3 animate-in fade-in">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Match {candidate.matchScore}%</Badge>
                  <Badge variant="secondary">{candidate.source}</Badge>
                  <Badge variant="secondary">{candidate.stage}</Badge>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Contact & links</h3>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <a
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      href={`mailto:${candidate.email}`}
                    >
                      <Mail className="size-4" />
                      {candidate.email}
                    </a>
                    {candidate.socials.linkedin && (
                      <a
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        href={candidate.socials.linkedin}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Linkedin className="size-4" />
                        LinkedIn
                      </a>
                    )}
                    {candidate.socials.github && (
                      <a
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        href={candidate.socials.github}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Github className="size-4" />
                        GitHub
                      </a>
                    )}
                    {candidate.resumeFileName && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <FileText className="size-4" />
                        {candidate.resumeFileName}
                      </span>
                    )}
                    {candidate.socials.portfolio && (
                      <a
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        href={candidate.socials.portfolio}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Globe className="size-4" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Skills assessment</h3>
                  {candidate.skills.length === 0 && (
                    <p className="text-xs text-muted-foreground">Not assessed yet.</p>
                  )}
                  {candidate.skills.map((s) => (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{s.name}</span>
                        <span>{s.score}/100</span>
                      </div>
                      <Progress value={s.score} className="h-1.5" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <h3 className="mb-1 font-semibold">Strengths</h3>
                    <ul className="list-disc pl-4 text-muted-foreground">
                      {candidate.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                      {candidate.strengths.length === 0 && <li>None recorded yet</li>}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">Gaps</h3>
                    <ul className="list-disc pl-4 text-muted-foreground">
                      {candidate.gaps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                      {candidate.gaps.length === 0 && <li>None recorded yet</li>}
                    </ul>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Stage history</h3>
                  <ol className="space-y-1 border-l border-border pl-3 text-sm">
                    {candidate.stageHistory.map((m, i) => (
                      <li key={i} className="text-muted-foreground">
                        <span className="text-foreground">{m.stage}</span> · {formatDate(m.at)}
                      </li>
                    ))}
                  </ol>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" /> Delete candidate data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {candidate.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes the profile, feedback, emails and scorecard, for
                        example to honour a data-erasure request. It can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          const name = candidate.name;
                          onClose();
                          deleteCandidate(candidate.id);
                          toast.success(`${name}'s data was deleted`);
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TabsContent>

              <TabsContent value="comments" className="space-y-3 pt-3 animate-in fade-in">
                <div className="space-y-2 rounded-xl border border-border p-3">
                  <StarInput value={rating} onChange={setRating} label="Your rating" />
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Share your feedback with the hiring team"
                  />
                  <Button
                    size="sm"
                    disabled={!text.trim()}
                    onClick={() => {
                      addComment(candidate.id, text.trim(), rating);
                      setText("");
                      toast.success("Comment added");
                    }}
                  >
                    Post comment
                  </Button>
                </div>
                {candidate.comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-border p-3 text-sm animate-in fade-in slide-in-from-top-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {c.author}{" "}
                        <span className="font-normal text-muted-foreground">· {c.role}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(c.timestamp)}
                      </span>
                    </div>
                    <div className="my-1 flex">
                      {Array.from({ length: c.rating }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-muted-foreground">{c.text}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="comms" className="space-y-3 pt-3 animate-in fade-in">
                <p className="text-xs text-muted-foreground">
                  Emails are logged automatically when a candidate moves to Screened, Interviewing
                  or Offer Sent, and when they are rejected.
                </p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <Button
                      key={t.id}
                      size="sm"
                      variant="outline"
                      disabled={Boolean(candidate.rejection)}
                      onClick={() => {
                        sendEmail(candidate.id, t.id);
                        toast.success(`${t.label} sent`);
                      }}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
                {candidate.communications.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-border p-3 text-sm animate-in fade-in"
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">{m.subject}</span>
                      <Badge variant="outline">{m.status}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{m.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(m.sentAt)}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
