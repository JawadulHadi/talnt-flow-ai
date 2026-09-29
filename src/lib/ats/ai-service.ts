import { buildRecommendation } from "./scoring";
import type { Ratings, Recommendation, StarQuestion } from "./types";

/**
 * Qeloma Agent for Recruiter service. No AI endpoint is configured yet, so every
 * call resolves through the resilient local engine and reports fallback mode.
 */
export interface AgentResult<T> {
  data: T;
  fallback: boolean;
}

const AI_ENDPOINT: string | null = null;

export async function checkAgentHealth(): Promise<boolean> {
  if (!AI_ENDPOINT) return false;
  try {
    const res = await fetch(`${AI_ENDPOINT}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function evaluateScorecard(
  candidateName: string,
  questions: StarQuestion[],
  ratings: Ratings,
): Promise<AgentResult<Recommendation>> {
  const local = buildRecommendation(candidateName, questions, ratings);
  if (!AI_ENDPOINT) return { data: local, fallback: true };
  try {
    const res = await fetch(`${AI_ENDPOINT}/scorecard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateName, questions, ratings }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as Recommendation;
    return { data: { ...data, generatedBy: "ai" }, fallback: false };
  } catch {
    return { data: local, fallback: true };
  }
}
