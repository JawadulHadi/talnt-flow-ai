import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildSeedCandidates, seedJobDescription, starQuestions } from "@/lib/ats/seed";
import { persistence } from "@/lib/ats/storage-service";
import type {
  Candidate,
  CandidateEmailLog,
  EmailTemplate,
  JobDescription,
  Rating,
  Ratings,
  Stage,
  StarQuestion,
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
  resetDemo: () => void;
}

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
      resetDemo: () =>
        set({
          candidates: buildSeedCandidates(),
          ratings: seedRatings(),
          jd: seedJobDescription,
          scorecardCandidateId: "cand-1",
        }),
    }),
    {
      name: "qeloma-ats-v1",
      storage: createJSONStorage(() => persistence),
      skipHydration: true,
      partialize: (s) => ({
        candidates: s.candidates,
        ratings: s.ratings,
        jd: s.jd,
        scorecardCandidateId: s.scorecardCandidateId,
      }),
    },
  ),
);
