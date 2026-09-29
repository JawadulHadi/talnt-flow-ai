import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  buildSeedCandidates,
  buildSeedIntegrations,
  buildSeedJobs,
  buildSeedRatings,
  buildSeedTeam,
  costBySource,
  seedJobDescription,
  starQuestions,
} from "@/lib/ats/seed";
import { persistence } from "@/lib/ats/storage-service";
import type {
  Candidate,
  CandidateEmailLog,
  EmailTemplate,
  Gender,
  JobBoardIntegration,
  JobDescription,
  JobPosting,
  JobStatus,
  Rating,
  Ratings,
  RejectionReason,
  Source,
  Stage,
  StarQuestion,
  TeamMember,
} from "@/lib/ats/types";

const uid = () => Math.random().toString(36).slice(2, 10);

export function emailFor(
  template: EmailTemplate,
  c: Pick<Candidate, "name" | "role">,
): Pick<CandidateEmailLog, "subject" | "body"> {
  const first = c.name.trim().split(/\s+/)[0] || c.name;
  switch (template) {
    case "confirm":
      return {
        subject: `Application received — ${c.role}`,
        body: `Hi ${first}, thanks for applying. We will be in touch within five working days.`,
      };
    case "reminder":
      return {
        subject: `Interview reminder — ${c.role}`,
        body: `Hi ${first}, a friendly reminder about your upcoming interview. Reply to this email if you need to reschedule.`,
      };
    case "feedback":
      return {
        subject: `An update on your application`,
        body: `Hi ${first}, thanks for your time so far. Here is where things stand and what happens next.`,
      };
    case "offer":
      return {
        subject: `Your offer — ${c.role}`,
        body: `Hi ${first}, we are delighted to offer you the ${c.role} role. Your offer letter is attached.`,
      };
    case "rejection":
      return {
        subject: `Your application — ${c.role}`,
        body: `Hi ${first}, thank you for your interest in the ${c.role} role. After careful review we will not be moving forward this time. We wish you every success.`,
      };
  }
}

const logEmail = (
  template: EmailTemplate,
  c: Pick<Candidate, "name" | "role">,
  sentAt: string,
): CandidateEmailLog => ({
  id: uid(),
  templateType: template,
  ...emailFor(template, c),
  sentAt,
  status: "Sent",
});

const autoTemplate: Partial<Record<Stage, EmailTemplate>> = {
  Screened: "feedback",
  Interviewing: "reminder",
  "Offer Sent": "offer",
};

export interface NewCandidateInput {
  jobId: string;
  name: string;
  email: string;
  source: Source;
  matchScore: number;
  phone?: string;
  location?: string;
  linkedin?: string;
  gender?: Gender;
  underrepresented?: boolean;
  resumeFileName?: string;
}

export type AddCandidateResult =
  { ok: true; id: string } | { ok: false; error: "job-not-found" | "job-not-open" | "duplicate" };

interface AtsState {
  candidates: Candidate[];
  jobs: JobPosting[];
  teamMembers: TeamMember[];
  integrations: JobBoardIntegration[];
  ratings: Record<string, Ratings>;
  questions: StarQuestion[];
  jd: JobDescription;
  scorecardCandidateId: string;
  moveStage: (id: string, stage: Stage) => void;
  addComment: (
    id: string,
    text: string,
    rating: number,
    by?: { author: string; role: string },
  ) => void;
  sendEmail: (id: string, template: EmailTemplate) => void;
  rejectCandidate: (id: string, reason: RejectionReason) => void;
  reactivateCandidate: (id: string) => void;
  deleteCandidate: (id: string) => void;
  setRating: (candidateId: string, questionId: number, rating: Partial<Rating>) => void;
  setScorecardCandidate: (id: string) => void;
  updateJd: (jd: JobDescription) => void;
  addJob: (job: Omit<JobPosting, "id" | "postedDate">) => void;
  setJobStatus: (id: string, status: JobStatus) => void;
  addCandidate: (input: NewCandidateInput) => AddCandidateResult;
  addTeamMember: (member: Omit<TeamMember, "id" | "status">) => boolean;
  removeTeamMember: (id: string) => void;
  toggleIntegration: (id: string) => void;
  resetDemo: () => void;
}

type PersistedAts = Pick<
  AtsState,
  "candidates" | "jobs" | "teamMembers" | "integrations" | "ratings" | "jd" | "scorecardCandidateId"
>;

const seedState = (): PersistedAts => ({
  candidates: buildSeedCandidates(),
  jobs: buildSeedJobs(),
  teamMembers: buildSeedTeam(),
  integrations: buildSeedIntegrations(),
  ratings: buildSeedRatings(),
  jd: seedJobDescription,
  scorecardCandidateId: "cand-1",
});

const isIsoDate = (v: unknown) => typeof v === "string" && !Number.isNaN(Date.parse(v));

/**
 * v0 (key "qeloma-ats-v1") stored only candidates, ratings, jd and the scorecard pick.
 * v1 adds jobs, team and integrations, links every candidate to a job, and stores
 * integration sync times as ISO timestamps. Existing pipeline work is kept.
 */
export function migrateAtsState(persisted: unknown, version: number): PersistedAts {
  const s = (persisted ?? {}) as Partial<PersistedAts>;
  if (version >= 1) return s as PersistedAts;
  const seed = seedState();
  const jobs = (s.jobs ?? seed.jobs).map(
    ({ id, title, department, location, salary, status, postedDate }) => ({
      id,
      title,
      department,
      location,
      salary,
      status,
      postedDate: isIsoDate(postedDate) ? postedDate : new Date().toISOString(),
    }),
  );
  const jobFor = (role: string) =>
    jobs.find((j) => j.title === role) ?? jobs.find((j) => j.title.startsWith(role)) ?? jobs[0];
  return {
    ...seed,
    ...s,
    jobs,
    candidates: (s.candidates ?? seed.candidates).map((c) =>
      c.jobId ? c : { ...c, jobId: jobFor(c.role)?.id ?? "job-1" },
    ),
    integrations: (s.integrations ?? seed.integrations).map((i) => {
      if (isIsoDate(i.lastSynced)) return i;
      const { lastSynced: _drop, ...rest } = i;
      return i.connected ? { ...rest, lastSynced: new Date().toISOString() } : rest;
    }),
  };
}

export const useAtsStore = create<AtsState>()(
  persist(
    (set, get) => ({
      ...seedState(),
      questions: starQuestions,
      moveStage: (id, stage) =>
        set((s) => ({
          candidates: s.candidates.map((c) => {
            if (c.id !== id || c.stage === stage || c.rejection) return c;
            const now = new Date().toISOString();
            const tpl = autoTemplate[stage];
            return {
              ...c,
              stage,
              stageHistory: [...c.stageHistory, { stage, at: now }],
              communications: tpl ? [logEmail(tpl, c, now), ...c.communications] : c.communications,
            };
          }),
        })),
      addComment: (id, text, rating, by = { author: "You", role: "Recruiter" }) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id
              ? {
                  ...c,
                  comments: [
                    {
                      id: uid(),
                      ...by,
                      rating,
                      text,
                      timestamp: new Date().toISOString(),
                    },
                    ...c.comments,
                  ],
                }
              : c,
          ),
        })),
      sendEmail: (id, template) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id
              ? {
                  ...c,
                  communications: [
                    logEmail(template, c, new Date().toISOString()),
                    ...c.communications,
                  ],
                }
              : c,
          ),
        })),
      rejectCandidate: (id, reason) =>
        set((s) => ({
          candidates: s.candidates.map((c) => {
            if (c.id !== id || c.rejection) return c;
            const now = new Date().toISOString();
            return {
              ...c,
              rejection: { reason, at: now },
              communications: [logEmail("rejection", c, now), ...c.communications],
            };
          }),
        })),
      reactivateCandidate: (id) =>
        set((s) => ({
          candidates: s.candidates.map((c) => {
            if (c.id !== id || !c.rejection) return c;
            const { rejection: _drop, ...rest } = c;
            return rest;
          }),
        })),
      deleteCandidate: (id) =>
        set((s) => {
          const candidates = s.candidates.filter((c) => c.id !== id);
          const { [id]: _drop, ...ratings } = s.ratings;
          return {
            candidates,
            ratings,
            scorecardCandidateId:
              s.scorecardCandidateId === id ? (candidates[0]?.id ?? "") : s.scorecardCandidateId,
          };
        }),
      setRating: (candidateId, questionId, rating) =>
        set((s) => {
          const current = s.ratings[candidateId] ?? {};
          const prev = current[questionId] ?? { score: 0, note: "" };
          return {
            ratings: {
              ...s.ratings,
              [candidateId]: { ...current, [questionId]: { ...prev, ...rating } },
            },
          };
        }),
      setScorecardCandidate: (id) => set({ scorecardCandidateId: id }),
      updateJd: (jd) => set({ jd }),
      addJob: (job) =>
        set((s) => ({
          jobs: [{ ...job, id: `job-${uid()}`, postedDate: new Date().toISOString() }, ...s.jobs],
        })),
      setJobStatus: (id, status) =>
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, status } : j)) })),
      addCandidate: (input) => {
        const { jobs, candidates } = get();
        const job = jobs.find((j) => j.id === input.jobId);
        if (!job) return { ok: false, error: "job-not-found" };
        if (job.status !== "Active") return { ok: false, error: "job-not-open" };
        const email = input.email.trim().toLowerCase();
        if (candidates.some((c) => c.jobId === job.id && c.email.toLowerCase() === email)) {
          return { ok: false, error: "duplicate" };
        }
        const now = new Date().toISOString();
        const { linkedin, ...profile } = input;
        const name = input.name.trim();
        const candidate: Candidate = {
          ...profile,
          id: `cand-${uid()}`,
          name,
          email,
          role: job.title,
          stage: "Sourced",
          matchScore: Math.max(0, Math.min(100, Math.round(input.matchScore))),
          appliedDate: now,
          sourcingCost: costBySource[input.source],
          socials: linkedin ? { linkedin } : {},
          skills: [],
          strengths: [],
          gaps: [],
          stageHistory: [{ stage: "Sourced", at: now }],
          comments: [],
          communications: [logEmail("confirm", { name, role: job.title }, now)],
        };
        set({ candidates: [candidate, ...candidates] });
        return { ok: true, id: candidate.id };
      },
      addTeamMember: (m) => {
        const email = m.email.trim().toLowerCase();
        if (get().teamMembers.some((t) => t.email.toLowerCase() === email)) return false;
        set((s) => ({
          teamMembers: [...s.teamMembers, { ...m, email, id: `tm-${uid()}`, status: "Pending" }],
        }));
        return true;
      },
      removeTeamMember: (id) =>
        set((s) => ({ teamMembers: s.teamMembers.filter((t) => t.id !== id) })),
      toggleIntegration: (id) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id !== id
              ? i
              : i.connected
                ? { ...i, connected: false }
                : { ...i, connected: true, lastSynced: new Date().toISOString() },
          ),
        })),
      resetDemo: () => set(seedState()),
    }),
    {
      // Keep the original key so existing browsers keep their pipeline; shape changes go
      // through `version` + `migrate` instead of a new key.
      name: "qeloma-ats-v1",
      version: 1,
      migrate: migrateAtsState,
      storage: createJSONStorage(() => persistence),
      skipHydration: true,
      partialize: (s): PersistedAts => ({
        candidates: s.candidates,
        jobs: s.jobs,
        teamMembers: s.teamMembers,
        integrations: s.integrations,
        ratings: s.ratings,
        jd: s.jd,
        scorecardCandidateId: s.scorecardCandidateId,
      }),
    },
  ),
);
