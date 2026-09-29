import { bottleneck, daysInStage, funnel, isOpenApplication, kpis } from "./analytics";
import { buildRecommendation } from "./scoring";
import type {
  Candidate,
  EmailTemplate,
  JobPosting,
  Ratings,
  Recommendation,
  Stage,
  StarQuestion,
} from "./types";
import { STAGES } from "./types";

/**
 * TalntFlow Agent — shared, isomorphic part.
 *
 * The agent never mutates the pipeline. It reads a snapshot through tools and returns
 * proposals; a recruiter approves each one in the UI before it is applied. The same
 * tool executors back the Claude loop (agent.server.ts) and the local rule-based
 * fallback below, so both modes produce the same result shape.
 */

export const AGENT_EMAIL_TEMPLATES = ["reminder", "feedback"] as const satisfies EmailTemplate[];
export type AgentEmailTemplate = (typeof AGENT_EMAIL_TEMPLATES)[number];

interface ProposalBase {
  id: string;
  candidateId: string;
  candidateName: string;
  rationale: string;
}
export type AgentProposal =
  | (ProposalBase & { kind: "move"; toStage: Stage })
  | (ProposalBase & { kind: "email"; template: AgentEmailTemplate })
  | (ProposalBase & { kind: "note"; note: string });

export interface AgentStep {
  tool: string;
  detail: string;
}

export interface AgentRun {
  summary: string;
  proposals: AgentProposal[];
  steps: AgentStep[];
  generatedBy: "ai" | "fallback";
}

/** What the agent may see. Contact details and EEO self-identification are never included. */
export interface AgentCandidate extends Pick<
  Candidate,
  | "id"
  | "jobId"
  | "name"
  | "role"
  | "stage"
  | "matchScore"
  | "source"
  | "appliedDate"
  | "stageHistory"
  | "skills"
  | "strengths"
  | "gaps"
> {
  rejection?: NonNullable<Candidate["rejection"]>;
  comments: { author: string; rating: number; text: string; timestamp: string }[];
  emails: { templateType: EmailTemplate; sentAt: string }[];
  scorecard?: { weightedScore: number; verdict: string; rated: number };
}

export interface AgentSnapshot {
  now: string;
  jobs: Pick<JobPosting, "id" | "title" | "department" | "status">[];
  candidates: AgentCandidate[];
}

export interface ScorecardInput {
  candidateName: string;
  role: string;
  items: { competency: string; weight: number; question: string; score: number; note: string }[];
  weightedScore: number;
  verdict: Recommendation["verdict"];
}

export type ScorecardNarrative = Pick<
  Recommendation,
  "executiveSummary" | "keyStrengths" | "areasToProbe"
>;

export const AGENT_LIMITS = { taskChars: 2000, candidates: 500, proposals: 15 } as const;

export function toAgentSnapshot(state: {
  candidates: Candidate[];
  jobs: JobPosting[];
  ratings: Record<string, Ratings>;
  questions: StarQuestion[];
}): AgentSnapshot {
  return {
    now: new Date().toISOString(),
    jobs: state.jobs.map(({ id, title, department, status }) => ({
      id,
      title,
      department,
      status,
    })),
    candidates: state.candidates.slice(0, AGENT_LIMITS.candidates).map((c) => {
      const ratings = state.ratings[c.id] ?? {};
      const rated = Object.values(ratings).filter((r) => r.score > 0).length;
      const rec = rated ? buildRecommendation(c.name, state.questions, ratings) : null;
      return {
        id: c.id,
        jobId: c.jobId,
        name: c.name,
        role: c.role,
        stage: c.stage,
        matchScore: c.matchScore,
        source: c.source,
        appliedDate: c.appliedDate,
        stageHistory: c.stageHistory,
        skills: c.skills,
        strengths: c.strengths,
        gaps: c.gaps,
        ...(c.rejection ? { rejection: c.rejection } : {}),
        comments: c.comments.map(({ author, rating, text, timestamp }) => ({
          author,
          rating,
          text,
          timestamp,
        })),
        emails: c.communications.map(({ templateType, sentAt }) => ({ templateType, sentAt })),
        ...(rec
          ? { scorecard: { weightedScore: rec.weightedScore, verdict: rec.verdict, rated } }
          : {}),
      };
    }),
  };
}

const daysSince = (iso: string, now: number) =>
  Math.floor((now - new Date(iso).getTime()) / 86_400_000);

function candidateRow(c: AgentCandidate, now: number) {
  const last = c.emails.reduce<AgentCandidate["emails"][number] | null>(
    (a, e) => (!a || e.sentAt > a.sentAt ? e : a),
    null,
  );
  const ratings = c.comments.map((x) => x.rating).filter((r) => r > 0);
  return {
    id: c.id,
    name: c.name,
    role: c.role,
    jobId: c.jobId,
    stage: c.stage,
    matchScore: c.matchScore,
    source: c.source,
    daysInStage: daysInStage(c, now),
    rejected: Boolean(c.rejection),
    comments: c.comments.length,
    avgFeedbackRating: ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null,
    lastEmail: last ? { template: last.templateType, daysAgo: daysSince(last.sentAt, now) } : null,
    scorecard: c.scorecard ?? null,
  };
}

/** Runs tools against one snapshot and collects proposals. */
export function createAgentSession(snapshot: AgentSnapshot) {
  const now = new Date(snapshot.now).getTime();
  const proposals: AgentProposal[] = [];
  const steps: AgentStep[] = [];
  const byId = new Map(snapshot.candidates.map((c) => [c.id, c]));

  const propose = (candidateId: string, make: (c: AgentCandidate) => AgentProposal | string) => {
    const c = byId.get(candidateId);
    if (!c) return { error: `Unknown candidateId "${candidateId}".` };
    if (c.rejection) return { error: `${c.name} has been rejected; no actions can be proposed.` };
    if (proposals.length >= AGENT_LIMITS.proposals) {
      return { error: `Proposal limit (${AGENT_LIMITS.proposals}) reached. Summarise now.` };
    }
    const p = make(c);
    if (typeof p === "string") return { error: p };
    if (proposals.some((x) => x.candidateId === p.candidateId && x.kind === p.kind)) {
      return { error: `A ${p.kind} proposal for ${c.name} already exists.` };
    }
    proposals.push(p);
    return { queued: true, message: "Queued for recruiter approval." };
  };
  const base = (c: AgentCandidate, rationale: unknown): ProposalBase => ({
    id: `p-${proposals.length + 1}`,
    candidateId: c.id,
    candidateName: c.name,
    rationale: String(rationale ?? "").slice(0, 400),
  });

  const tools: Record<string, (input: Record<string, unknown>) => unknown> = {
    get_pipeline_overview: () => {
      const k = kpis(snapshot.candidates);
      return {
        kpis: k,
        funnel: funnel(snapshot.candidates).map(({ stage, reached, conversion }) => ({
          stage,
          reached,
          conversion,
        })),
        bottleneck: bottleneck(snapshot.candidates),
        jobs: snapshot.jobs.map((j) => {
          const open = snapshot.candidates.filter((c) => c.jobId === j.id && isOpenApplication(c));
          return {
            ...j,
            openApplications: open.length,
            byStage: Object.fromEntries(
              STAGES.map((s) => [s, open.filter((c) => c.stage === s).length]),
            ),
          };
        }),
      };
    },
    list_candidates: (input) => {
      const jobId = String(input["jobId"] ?? "");
      const stage = String(input["stage"] ?? "Any");
      const minDays = Number(input["minDaysInStage"] ?? 0);
      const includeRejected = input["includeRejected"] === true;
      const rows = snapshot.candidates
        .filter((c) => includeRejected || !c.rejection)
        .filter((c) => !jobId || c.jobId === jobId)
        .filter((c) => stage === "Any" || c.stage === stage)
        .map((c) => candidateRow(c, now))
        .filter((r) => r.daysInStage >= minDays)
        .sort((a, b) => b.daysInStage - a.daysInStage);
      return { count: rows.length, candidates: rows.slice(0, 50) };
    },
    get_candidate: (input) => {
      const c = byId.get(String(input["candidateId"]));
      if (!c) return { error: `Unknown candidateId "${String(input["candidateId"])}".` };
      return {
        ...candidateRow(c, now),
        rejection: c.rejection ?? null,
        stageHistory: c.stageHistory,
        skills: c.skills,
        strengths: c.strengths,
        gaps: c.gaps,
        recentFeedback: [...c.comments]
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
          .slice(0, 5),
      };
    },
    propose_stage_move: (input) =>
      propose(String(input["candidateId"]), (c) => {
        const toStage = input["toStage"] as Stage;
        if (!STAGES.includes(toStage)) return `Unknown stage "${String(toStage)}".`;
        if (c.stage === toStage) return `${c.name} is already in ${toStage}.`;
        return { ...base(c, input["rationale"]), kind: "move", toStage };
      }),
    propose_email: (input) =>
      propose(String(input["candidateId"]), (c) => {
        const template = input["template"] as AgentEmailTemplate;
        if (!AGENT_EMAIL_TEMPLATES.includes(template))
          return `Unknown template "${String(template)}".`;
        return { ...base(c, input["rationale"]), kind: "email", template };
      }),
    propose_note: (input) =>
      propose(String(input["candidateId"]), (c) => {
        const note = String(input["note"] ?? "")
          .trim()
          .slice(0, 600);
        if (!note) return "Note text is empty.";
        return { ...base(c, input["rationale"]), kind: "note", note };
      }),
  };

  return {
    execute(name: string, input: unknown): { content: string; isError: boolean } {
      const args = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
      const fn = tools[name];
      const result = fn ? fn(args) : { error: `Unknown tool "${name}".` };
      const isError = typeof result === "object" && result !== null && "error" in result;
      const detail = Object.entries(args)
        .filter(([k, v]) => k !== "rationale" && k !== "note" && v !== "" && v !== "Any")
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(", ");
      steps.push({
        tool: name,
        detail: isError ? `${detail} → ${(result as { error: string }).error}` : detail,
      });
      return { content: JSON.stringify(result), isError };
    },
    result(summary: string, generatedBy: AgentRun["generatedBy"]): AgentRun {
      return { summary, proposals, steps, generatedBy };
    },
  };
}

/**
 * Deterministic fallback used when Claude isn't configured or unreachable. It runs the
 * same tools with fixed triage rules, so the page stays useful offline.
 */
export function runLocalAgent(snapshot: AgentSnapshot): AgentRun {
  const session = createAgentSession(snapshot);
  const overview = JSON.parse(session.execute("get_pipeline_overview", {}).content) as {
    bottleneck: { stage: Stage; conversion: number };
  };
  const { candidates } = JSON.parse(
    session.execute("list_candidates", { jobId: "", stage: "Any", minDaysInStage: 3 }).content,
  ) as { candidates: ReturnType<typeof candidateRow>[] };

  for (const c of candidates) {
    const days = c.daysInStage;
    if (c.stage === "Sourced" && c.matchScore >= 75) {
      session.execute("propose_stage_move", {
        candidateId: c.id,
        toStage: "Screened",
        rationale: `${c.matchScore}% match and waiting ${days} days in Sourced.`,
      });
    } else if (c.stage === "Sourced" && days >= 14) {
      session.execute("propose_note", {
        candidateId: c.id,
        note: `Stalled in Sourced for ${days} days with a ${c.matchScore}% match. Review and decide.`,
        rationale: "Long wait without a decision hurts candidate experience.",
      });
    } else if (c.stage === "Screened" && c.matchScore >= 80) {
      session.execute("propose_stage_move", {
        candidateId: c.id,
        toStage: "Interviewing",
        rationale: `${c.matchScore}% match, screened ${days} days ago.`,
      });
    } else if (
      c.stage === "Interviewing" &&
      days >= 7 &&
      !(c.lastEmail?.template === "reminder" && c.lastEmail.daysAgo < 7)
    ) {
      session.execute("propose_email", {
        candidateId: c.id,
        template: "reminder",
        rationale: `Interviewing for ${days} days with no reminder this week.`,
      });
    } else if (c.stage === "Offer Sent" && days >= 5) {
      session.execute("propose_note", {
        candidateId: c.id,
        note: `Offer outstanding for ${days} days. Follow up by phone.`,
        rationale: "Offers left open for over a working week are at risk.",
      });
    }
  }

  const n = session.result("", "fallback").proposals.length;
  const b = overview.bottleneck;
  return session.result(
    `Checked ${candidates.length} open candidates waiting 3+ days in their stage. ` +
      `${n ? `${n} action${n === 1 ? "" : "s"} proposed for your review.` : "Nothing needs action right now."} ` +
      `The weakest step is into ${b.stage} at ${b.conversion}% conversion. ` +
      `Local triage rules ran because Claude is not connected, so free-form instructions were not interpreted.`,
    "fallback",
  );
}
