import { describe, expect, it } from "vitest";
import { buildRecommendation, weightedScore } from "./scoring";
import { funnel, kpis, formatDate } from "./analytics";
import { starQuestions, buildSeedCandidates } from "./seed";

describe("scoring", () => {
  it("returns 0 with no ratings and 100 with all fives", () => {
    expect(weightedScore(starQuestions, {})).toBe(0);
    const all = Object.fromEntries(starQuestions.map((q) => [q.id, { score: 5, note: "" }]));
    expect(weightedScore(starQuestions, all)).toBe(100);
    expect(buildRecommendation("A", starQuestions, all).verdict).toBe("Strong hire");
  });
});

describe("analytics", () => {
  it("funnel starts with all candidates and kpis count hires", () => {
    const c = buildSeedCandidates();
    expect(funnel(c)[0]?.reached).toBe(c.length);
    expect(kpis(c).hired).toBe(c.filter((x) => x.stage === "Hired").length);
  });
  it("formats dates as DD/MM/YYYY", () => {
    expect(formatDate("2026-09-03T10:00:00Z")).toBe("03/09/2026");
  });
});
