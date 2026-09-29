import type { Ratings, Recommendation, StarQuestion } from "./types";

/** Weighted 0–100 score from 1–5 star ratings. Unrated questions are ignored. */
export function weightedScore(questions: StarQuestion[], ratings: Ratings): number {
  let total = 0;
  let weights = 0;
  for (const q of questions) {
    const r = ratings[q.id];
    if (!r || r.score < 1) continue;
    total += ((r.score - 1) / 4) * q.weight;
    weights += q.weight;
  }
  return weights === 0 ? 0 : Math.round((total / weights) * 100);
}

export function verdictFor(score: number): Recommendation["verdict"] {
  if (score >= 85) return "Strong hire";
  if (score >= 70) return "Hire";
  if (score >= 55) return "Lean hire";
  return "No hire";
}

/** Deterministic recommendation engine, used directly and as the AI fallback. */
export function buildRecommendation(
  candidateName: string,
  questions: StarQuestion[],
  ratings: Ratings,
): Recommendation {
  const score = weightedScore(questions, ratings);
  const rated = questions.filter((q) => (ratings[q.id]?.score ?? 0) > 0);
  const sorted = [...rated].sort(
    (a, b) => (ratings[b.id]?.score ?? 0) * b.weight - (ratings[a.id]?.score ?? 0) * a.weight,
  );
  const strengths = sorted
    .filter((q) => (ratings[q.id]?.score ?? 0) >= 4)
    .slice(0, 3)
    .map((q) => `${q.competency}${ratings[q.id]?.note ? ` — ${ratings[q.id]?.note}` : ""}`);
  const probe = [...sorted]
    .reverse()
    .filter((q) => (ratings[q.id]?.score ?? 0) <= 3)
    .slice(0, 3)
    .map((q) => `${q.competency}: ${q.followUp}`);
  const unrated = questions.length - rated.length;
  const verdict = verdictFor(score);
  const summary =
    rated.length === 0
      ? `No questions have been rated for ${candidateName} yet.`
      : `${candidateName} earned a weighted score of ${score}/100 across ${rated.length} competencies, giving a "${verdict.toLowerCase()}" recommendation.${
          unrated > 0 ? ` ${unrated} question${unrated === 1 ? " is" : "s are"} still unrated.` : ""
        }`;
  return {
    verdict,
    weightedScore: score,
    executiveSummary: summary,
    keyStrengths: strengths.length ? strengths : ["No standout strengths recorded yet"],
    areasToProbe: probe.length ? probe : ["No major gaps identified"],
    generatedBy: "fallback",
  };
}
