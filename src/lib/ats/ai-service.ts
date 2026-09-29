import { buildRecommendation } from "./scoring";
import { runLocalAgent, toAgentSnapshot, type AgentRun } from "./agent";
import { getAgentStatus, runAgentTask, summarizeScorecard } from "./agent.functions";
import type { Candidate, JobPosting, Ratings, Recommendation, StarQuestion } from "./types";

/**
 * TalntFlow Agent client. Every call tries Claude through the server functions first and
 * falls back to the local engines; `fallback: true` tells the caller to show the offline banner.
 */
export interface AgentResult<T> {
  data: T;
  fallback: boolean;
}

export async function checkAgentHealth(): Promise<boolean> {
  try {
    return (await getAgentStatus()).configured;
  } catch {
    return false;
  }
}

export async function evaluateScorecard(
  candidate: Pick<Candidate, "name" | "role">,
  questions: StarQuestion[],
  ratings: Ratings,
): Promise<AgentResult<Recommendation>> {
  const local = buildRecommendation(candidate.name, questions, ratings);
  try {
    const narrative = await summarizeScorecard({
      data: {
        candidateName: candidate.name,
        role: candidate.role,
        weightedScore: local.weightedScore,
        verdict: local.verdict,
        items: questions.map((q) => ({
          competency: q.competency,
          weight: q.weight,
          question: q.question,
          score: ratings[q.id]?.score ?? 0,
          note: ratings[q.id]?.note ?? "",
        })),
      },
    });
    if (!narrative) return { data: local, fallback: true };
    return { data: { ...local, ...narrative, generatedBy: "ai" }, fallback: false };
  } catch (error) {
    console.error(error);
    return { data: local, fallback: true };
  }
}

export async function runAgent(
  task: string,
  state: {
    candidates: Candidate[];
    jobs: JobPosting[];
    ratings: Record<string, Ratings>;
    questions: StarQuestion[];
  },
): Promise<AgentResult<AgentRun>> {
  const snapshot = toAgentSnapshot(state);
  try {
    const run = await runAgentTask({ data: { task, snapshot } });
    if (run) return { data: run, fallback: false };
  } catch (error) {
    console.error(error);
  }
  return { data: runLocalAgent(snapshot), fallback: true };
}
