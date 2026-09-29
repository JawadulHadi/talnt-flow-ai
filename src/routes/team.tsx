import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, ShieldCheck, UserPlus, Users } from "lucide-react";
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
import type { TeamMember } from "@/lib/ats/types";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team & Role Hierarchy — TalntFlow AI" },
      {
        name: "description",
        content: "Manage recruitment team members, role hierarchy, and permissions.",
      },
      { property: "og:title", content: "Team & Role Hierarchy — TalntFlow AI" },
    ],
  }),
  component: TeamPage,
});

const roleHierarchy: {
  role: TeamMember["role"];
  level: number;
  description: string;
  badgeColor: string;
}[] = [
  {
    role: "Owner / Admin",
    level: 1,
    description: "Full platform access, billing, integrations, and role assignment.",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    role: "Hiring Manager",
    level: 2,
    description: "Can create job requisitions, review scorecards, and make final hire decisions.",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    role: "Senior Recruiter",
    level: 3,
    description: "Sourced pipeline management, candidate outreach, and interview scheduling.",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    role: "Interviewer",
    level: 4,
    description: "Assigned STAR interview scorecards, feedback notes, and candidate ratings.",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
];

function TeamPage() {
  const teamMembers = useAtsStore((s) => s.teamMembers);
  const addTeamMember = useAtsStore((s) => s.addTeamMember);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMember["role"]>("Interviewer");
  const [department, setDepartment] = useState("Engineering");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter name and email");
      return;
    }
    addTeamMember({ name, email, role, department });
    toast.success(`Invitation sent to ${name} (${role})!`);
    setName("");
    setEmail("");
    setInviteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Collaboration & Access</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Team & Role Hierarchy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage recruiting team members, department access, and hierarchical permissions.
          </p>
        </div>
        <Button
          onClick={() => setInviteModalOpen(true)}
          className="gap-2 bg-primary text-primary-foreground shadow-lg"
        >
          <UserPlus className="size-4" /> Invite Team Member
        </Button>
      </div>

      {/* Role Hierarchy Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roleHierarchy.map((h) => (
          <div
            key={h.role}
            className="glass rounded-2xl border border-border/70 p-5 shadow-lg backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${h.badgeColor}`}
              >
                Level {h.level}
              </span>
              <ShieldCheck className="size-4 text-primary" />
            </div>
            <h3 className="mt-3 font-display text-lg font-bold text-foreground">{h.role}</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{h.description}</p>
          </div>
        ))}
      </div>

      {/* Team Members List */}
      <div className="glass rounded-2xl border border-border/70 p-6 shadow-xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Users className="size-5 text-primary" /> Active Team Roster ({teamMembers.length})
          </h2>
        </div>

        <div className="divide-y divide-border/60">
          {teamMembers.map((member) => {
            const hInfo = roleHierarchy.find((r) => r.role === member.role);
            return (
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
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${hInfo?.badgeColor ?? "bg-secondary text-secondary-foreground border-border"}`}
                  >
                    {member.role}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                    {member.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="glass sm:max-w-md border-border bg-card/90 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Shield className="size-5 text-primary" /> Invite Team Member
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Assign a role and department to grant appropriate pipeline and scorecard permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tname">Full Name</Label>
              <Input
                id="tname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. David Miller"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temail">Work Email</Label>
              <Input
                id="temail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="david@talntflow.ai"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trole">Role Hierarchy</Label>
                <Select value={role} onValueChange={(v) => setRole(v as TeamMember["role"])}>
                  <SelectTrigger id="trole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner / Admin">Owner / Admin</SelectItem>
                    <SelectItem value="Hiring Manager">Hiring Manager</SelectItem>
                    <SelectItem value="Senior Recruiter">Senior Recruiter</SelectItem>
                    <SelectItem value="Interviewer">Interviewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tdept">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="tdept">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Executive">Executive</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Talent">Talent</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
