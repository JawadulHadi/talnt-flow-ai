import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildSeedCandidates, seedJobDescription, starQuestions } from "@/lib/ats/seed";
import { persistence } from "@/lib/ats/storage-service";
import type {
  Candidate,
  CandidateEmailLog,
  EmailTemplate,
  JobBoardIntegration,
  JobDescription,
  JobPosting,
  Rating,
  Ratings,
  Stage,
  StarQuestion,
  TeamMember,
} from "@/lib/ats/types";

const uid = () => Math.random().toString(36).slice(2, 10);

export function emailFor(
  template: EmailTemplate,
  c: Candidate,
): Pick<CandidateEmailLog, "subject" | "body"> {
  const first = c.name.split(" ")[0] ?? c.name;
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
  }
}

const autoTemplate: Partial<Record<Stage, EmailTemplate>> = {
  Screened: "feedback",
  Interviewing: "reminder",
  "Offer Sent": "offer",
};

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
  addComment: (id: string, text: string, rating: number) => void;
  sendEmail: (id: string, template: EmailTemplate) => void;
  setRating: (candidateId: string, questionId: number, rating: Partial<Rating>) => void;
  setScorecardCandidate: (id: string) => void;
  updateJd: (jd: JobDescription) => void;
  addJob: (job: Omit<JobPosting, "id" | "applicantsCount" | "postedDate">) => void;
  addCandidate: (
    candidate: Omit<Candidate, "id" | "stageHistory" | "comments" | "communications">,
  ) => void;
  addTeamMember: (member: Omit<TeamMember, "id" | "status">) => void;
  toggleIntegration: (id: string) => void;
  resetDemo: () => void;
}

const seedJobs: JobPosting[] = [
  {
    id: "job-1",
    title: "Senior Product Designer — Analytics & Core UI",
    department: "Design",
    location: "Remote (Global)",
    salary: "€130k – €158k",
    status: "Active",
    applicantsCount: 12,
    postedDate: "2026-09-01",
  },
  {
    id: "job-2",
    title: "Staff Frontend Engineer — React & TanStack",
    department: "Engineering",
    location: "Hybrid (Berlin / Lisbon)",
    salary: "€140k – €175k",
    status: "Active",
    applicantsCount: 8,
    postedDate: "2026-09-05",
  },
  {
    id: "job-3",
    title: "Head of Product AI",
    department: "Product",
    location: "Remote (US/EU)",
    salary: "$180k – $220k",
    status: "Draft",
    applicantsCount: 0,
    postedDate: "2026-09-20",
  },
];

const seedTeam: TeamMember[] = [
  {
    id: "tm-1",
    name: "Jawadul Hadi",
    email: "jawadulhadicc@gmail.com",
    role: "Owner / Admin",
    department: "Executive",
    status: "Active",
  },
  {
    id: "tm-2",
    name: "Maya Chen",
    email: "maya@talntflow.ai",
    role: "Hiring Manager",
    department: "Design",
    status: "Active",
  },
  {
    id: "tm-3",
    name: "Alex Mercer",
    email: "alex@talntflow.ai",
    role: "Senior Recruiter",
    department: "Talent",
    status: "Active",
  },
  {
    id: "tm-4",
    name: "Sarah Jenkins",
    email: "sarah@talntflow.ai",
    role: "Interviewer",
    department: "Engineering",
    status: "Active",
  },
];

const seedIntegrations: JobBoardIntegration[] = [
  {
    id: "int-google",
    name: "Google Workspace & Sign In",
    category: "Authentication",
    connected: true,
    lastSynced: "Just now",
  },
  {
    id: "int-linkedin",
    name: "LinkedIn Talent Solutions",
    category: "Job Board",
    connected: true,
    lastSynced: "10 mins ago",
  },
  { id: "int-indeed", name: "Indeed Hiring Platform", category: "Job Board", connected: false },
  { id: "int-greenhouse", name: "Greenhouse ATS", category: "HRIS", connected: false },
  { id: "int-lever", name: "Lever Recruit", category: "HRIS", connected: false },
];

const seedRatings = (): Record<string, Ratings> => ({
  "cand-1": {
    1: { score: 5, note: "Framed an unclear roadmap proactively" },
    2: { score: 4, note: "Empathetic mentorship" },
    3: { score: 5, note: "Resolved PM disagreement with data" },
    4: { score: 4, note: "" },
    5: { score: 3, note: "Pivot story lacked metrics" },
  },
});

export const useAtsStore = create<AtsState>()(
  persist(
    (set) => ({
      candidates: buildSeedCandidates(),
      jobs: seedJobs,
      teamMembers: seedTeam,
      integrations: seedIntegrations,
      ratings: seedRatings(),
      questions: starQuestions,
      jd: seedJobDescription,
      scorecardCandidateId: "cand-1",
      moveStage: (id, stage) =>
        set((s) => ({
          candidates: s.candidates.map((c) => {
            if (c.id !== id || c.stage === stage) return c;
            const now = new Date().toISOString();
            const tpl = autoTemplate[stage];
            const log: CandidateEmailLog[] = tpl
              ? [{ id: uid(), templateType: tpl, ...emailFor(tpl, c), sentAt: now, status: "Sent" }]
              : [];
            return {
              ...c,
              stage,
              stageHistory: [...c.stageHistory, { stage, at: now }],
              communications: [...log, ...c.communications],
            };
          }),
        })),
      addComment: (id, text, rating) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id
              ? {
                  ...c,
                  comments: [
                    {
                      id: uid(),
                      author: "You",
                      role: "Recruiter",
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
                    {
                      id: uid(),
                      templateType: template,
                      ...emailFor(template, c),
                      sentAt: new Date().toISOString(),
                      status: "Sent",
                    },
                    ...c.communications,
                  ],
                }
              : c,
          ),
        })),
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
      addJob: (jobData) =>
        set((s) => ({
          jobs: [
            {
              id: `job-${s.jobs.length + 1}`,
              applicantsCount: 0,
              postedDate: new Date().toISOString().split("T")[0]!,
              ...jobData,
            },
            ...s.jobs,
          ],
        })),
      addCandidate: (cData) =>
        set((s) => {
          const id = `cand-${s.candidates.length + 1}`;
          const now = new Date().toISOString();
          const newCandidate: Candidate = {
            id,
            stageHistory: [{ stage: cData.stage ?? "Sourced", at: now }],
            comments: [],
            communications: [
              {
                id: uid(),
                templateType: "confirm",
                subject: `Application received — ${cData.role}`,
                body: `Hi ${cData.name.split(" ")[0]}, thanks for applying. We will be in touch within five working days.`,
                sentAt: now,
                status: "Opened",
              },
            ],
            strengths: ["Fast-track profile", "Parsed via AI resume scanner"],
            gaps: [],
            ...cData,
          };
          return { candidates: [newCandidate, ...s.candidates] };
        }),
      addTeamMember: (m) =>
        set((s) => ({
          teamMembers: [
            { id: `tm-${s.teamMembers.length + 1}`, status: "Active", ...m },
            ...s.teamMembers,
          ],
        })),
      toggleIntegration: (id) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, connected: !i.connected, lastSynced: "Just now" } : i,
          ),
        })),
      resetDemo: () =>
        set({
          candidates: buildSeedCandidates(),
          jobs: seedJobs,
          teamMembers: seedTeam,
          integrations: seedIntegrations,
          ratings: seedRatings(),
          jd: seedJobDescription,
          scorecardCandidateId: "cand-1",
        }),
    }),
    {
      name: "qeloma-ats-v2",
      storage: createJSONStorage(() => persistence),
      skipHydration: true,
      partialize: (s) => ({
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
