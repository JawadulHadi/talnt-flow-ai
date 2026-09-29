import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, ShieldCheck, UserPlus, Users, X } from "lucide-react";
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
import { EMAIL_RE } from "@/lib/ats/candidate-input";
import { TEAM_ROLES, type TeamMember } from "@/lib/ats/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team & roles — TalntFlow AI" },
      {
        name: "description",
        content: "Manage recruitment team members, role hierarchy, and permissions.",
      },
      { property: "og:title", content: "Team & roles — TalntFlow AI" },
    ],
  }),
  component: TeamPage,
});

const roleHierarchy: { role: TeamMember["role"]; level: number; description: string }[] = [
  {
    role: "Owner / Admin",
    level: 1,
    description: "Full platform access, billing, integrations, and role assignment.",
  },
  {
    role: "Hiring Manager",
    level: 2,
    description: "Creates job requisitions, reviews scorecards, and makes final hire decisions.",
  },
  {
    role: "Senior Recruiter",
    level: 3,
    description: "Manages the pipeline, candidate outreach, and interview scheduling.",
  },
  {
    role: "Interviewer",
    level: 4,
    description: "Completes assigned STAR scorecards, feedback notes, and candidate ratings.",
  },
];

const DEPARTMENTS = ["Executive", "Engineering", "Design", "Talent", "Product"];

function TeamPage() {
  const teamMembers = useAtsStore((s) => s.teamMembers);
  const removeTeamMember = useAtsStore((s) => s.removeTeamMember);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const pending = teamMembers.filter((m) => m.status === "Pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Collaboration & access</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Team & roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage recruiting team members, department access, and role permissions.
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)} className="gap-2">
          <UserPlus className="size-4" /> Invite team member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roleHierarchy.map((h) => (
          <div key={h.role} className="glass p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Level {h.level}
              </span>
              <ShieldCheck className="size-4 text-primary" />
            </div>
            <h3 className="mt-3 font-display text-lg font-bold text-foreground">{h.role}</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{h.description}</p>
          </div>
        ))}
      </div>

      <div className="glass p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
          <Users className="size-5 text-primary" /> Team roster ({teamMembers.length})
          {pending > 0 && (
            <span className="text-sm font-normal text-muted-foreground">· {pending} pending</span>
          )}
        </h2>

        <div className="divide-y divide-border/60">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.email} · {member.department}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {member.role}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                    member.status === "Active"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-dashed border-border text-muted-foreground",
                  )}
                >
                  {member.status === "Pending" ? "Invite pending" : "Active"}
                </span>
                {member.role !== "Owner / Admin" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label={
                      member.status === "Pending"
                        ? `Revoke invite for ${member.name}`
                        : `Remove ${member.name}`
                    }
                    onClick={() => {
                      removeTeamMember(member.id);
                      toast.success(
                        member.status === "Pending"
                          ? `Invite for ${member.name} revoked.`
                          : `${member.name} removed from the team.`,
                      );
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Shield className="size-5 text-primary" /> Invite team member
            </DialogTitle>
            <DialogDescription>
              They stay pending until they accept. The role sets their pipeline and scorecard
              permissions.
            </DialogDescription>
          </DialogHeader>
          <InviteForm onDone={() => setInviteModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const addTeamMember = useAtsStore((s) => s.addTeamMember);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMember["role"]>("Interviewer");
  const [department, setDepartment] = useState("Engineering");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = { name: name.trim(), email: email.trim() };
    if (!clean.name) return void toast.error("Enter a name.");
    if (!EMAIL_RE.test(clean.email)) return void toast.error("Enter a valid work email.");
    if (!addTeamMember({ ...clean, role, department })) {
      return void toast.error(`${clean.email} is already on the team.`);
    }
    toast.success(`Invite created for ${clean.name} (${role}).`);
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="tname">Full name</Label>
        <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="temail">Work email</Label>
        <Input
          id="temail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="trole">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as TeamMember["role"])}>
            <SelectTrigger id="trole">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEAM_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tdept">Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="tdept">
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
      </div>
      <DialogFooter className="pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Create invite</Button>
      </DialogFooter>
    </form>
  );
}
