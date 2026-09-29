import { beforeEach, describe, expect, it } from "vitest";
import { buildRecommendation, weightedScore } from "./scoring";
import { diversity, formatDate, funnel, kpis, stageVelocity, timeAgo } from "./analytics";
import { buildSeedCandidates, costBySource, starQuestions } from "./seed";
import { nameFromFileName } from "./candidate-input";
import { createAgentSession, runLocalAgent, toAgentSnapshot } from "./agent";
import { migrateAtsState, useAtsStore } from "@/stores/ats-store";

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
  it("formats dates as DD/MM/YYYY and relative times", () => {
    expect(formatDate("2026-09-03T10:00:00Z")).toBe("03/09/2026");
    const now = Date.parse("2026-09-30T12:00:00Z");
    expect(timeAgo("2026-09-30T11:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-09-30T11:15:00Z", now)).toBe("45 min ago");
    expect(timeAgo("2026-09-27T12:00:00Z", now)).toBe("3 d ago");
  });
  it("diversity ignores candidates who did not disclose", () => {
    const [a, b] = buildSeedCandidates();
    const { gender: _g, underrepresented: _u, ...undisclosed } = b!;
    const row = diversity([{ ...a!, gender: "Woman", underrepresented: true }, undisclosed])[0]!;
    expect(row.women).toBe(100);
    expect(row.underrepresented).toBe(100);
    expect(row.disclosed).toBe(50);
  });
  it("excludes rejected candidates from the active count", () => {
    const c = buildSeedCandidates();
    const open = kpis(c).active;
    c[0] = { ...c[0]!, rejection: { reason: "Withdrew", at: new Date().toISOString() } };
    expect(kpis(c).active).toBe(open - 1);
  });
});

describe("store", () => {
  beforeEach(() => useAtsStore.getState().resetDemo());

  it("adds candidates at Sourced with a real history, cost and job link", () => {
    const s = useAtsStore.getState();
    const res = s.addCandidate({
      jobId: "job-1",
      name: "  Elena Rostova ",
      email: "Elena@Example.com",
      source: "Agency",
      matchScore: 88,
    });
    expect(res.ok).toBe(true);
    const c = useAtsStore.getState().candidates[0]!;
    expect(c).toMatchObject({
      name: "Elena Rostova",
      email: "elena@example.com",
      stage: "Sourced",
      jobId: "job-1",
      sourcingCost: costBySource.Agency,
    });
    expect(c.gender).toBeUndefined();
    expect(c.stageHistory).toHaveLength(1);
    expect(c.communications[0]?.body).toMatch(/^Hi Elena,/);
  });

  it("rejects duplicates and closed jobs", () => {
    const s = useAtsStore.getState();
    const input = {
      jobId: "job-1",
      name: "A B",
      email: "a@b.co",
      source: "Inbound",
      matchScore: 70,
    } as const;
    expect(s.addCandidate(input).ok).toBe(true);
    expect(useAtsStore.getState().addCandidate(input)).toEqual({ ok: false, error: "duplicate" });
    expect(useAtsStore.getState().addCandidate({ ...input, jobId: "job-6" })).toEqual({
      ok: false,
      error: "job-not-open",
    });
  });

  it("invites stay pending and ids never collide after deletes", () => {
    const s = useAtsStore.getState();
    expect(
      s.addTeamMember({ name: "D", email: "d@x.io", role: "Interviewer", department: "Design" }),
    ).toBe(true);
    expect(useAtsStore.getState().teamMembers.at(-1)?.status).toBe("Pending");
    useAtsStore.getState().deleteCandidate("cand-12");
    const input = { jobId: "job-2", source: "Inbound", matchScore: 60 } as const;
    useAtsStore.getState().addCandidate({ ...input, name: "X", email: "x@x.io" });
    useAtsStore.getState().addCandidate({ ...input, name: "Y", email: "y@x.io" });
    const ids = useAtsStore.getState().candidates.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rejection blocks stage moves until reactivated", () => {
    const s = useAtsStore.getState();
    s.rejectCandidate("cand-3", "Skills mismatch");
    useAtsStore.getState().moveStage("cand-3", "Hired");
    let c = useAtsStore.getState().candidates.find((x) => x.id === "cand-3")!;
    expect(c.stage).toBe("Screened");
    expect(c.communications[0]?.templateType).toBe("rejection");
    useAtsStore.getState().reactivateCandidate("cand-3");
    useAtsStore.getState().moveStage("cand-3", "Interviewing");
    c = useAtsStore.getState().candidates.find((x) => x.id === "cand-3")!;
    expect(c.rejection).toBeUndefined();
    expect(c.stage).toBe("Interviewing");
  });

  it("migrates v0 data without losing pipeline work", () => {
    const candidates = buildSeedCandidates().map(({ jobId: _j, ...c }) => ({
      ...c,
      stage: "Offer Sent" as const,
    }));
    const out = migrateAtsState(
      {
        candidates,
        integrations: [
          { id: "i", name: "I", category: "HRIS", connected: true, lastSynced: "Just now" },
        ],
      },
      0,
    );
    expect(out.candidates.every((c) => c.stage === "Offer Sent")).toBe(true);
    expect(out.candidates.find((c) => c.role === "UX Researcher")?.jobId).toBe("job-4");
    expect(out.jobs.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(out.integrations[0]!.lastSynced!))).toBe(false);
  });
});

describe("stage velocity", () => {
  it("measures time in each stage from history", () => {
    const [c] = buildSeedCandidates();
    const v = stageVelocity([c!]);
    expect(v.find((s) => s.stage === "Sourced")!.days).toBeGreaterThan(0);
  });
});

describe("agent", () => {
  const snapshot = () => {
    const { candidates, jobs, ratings, questions } = useAtsStore.getState();
    return toAgentSnapshot({ candidates, jobs, ratings, questions });
  };
  beforeEach(() => useAtsStore.getState().resetDemo());

  it("never sends contact details or EEO data to the model", () => {
    const json = JSON.stringify(snapshot());
    expect(json).not.toMatch(/@example\.com|"gender"|underrepresented|"phone"/);
  });

  it("validates proposals and blocks duplicates", () => {
    const session = createAgentSession(snapshot());
    const ok = session.execute("propose_stage_move", {
      candidateId: "cand-6",
      toStage: "Screened",
      rationale: "r",
    });
    expect(ok.isError).toBe(false);
    expect(
      session.execute("propose_stage_move", { candidateId: "cand-6", toStage: "Hired" }).isError,
    ).toBe(true);
    expect(session.execute("propose_note", { candidateId: "nope", note: "x" }).isError).toBe(true);
    expect(session.execute("drop_tables", {}).isError).toBe(true);
    expect(session.result("", "ai").proposals).toHaveLength(1);
  });

  it("local fallback proposes actions without rejecting anyone", () => {
    const run = runLocalAgent(snapshot());
    expect(run.generatedBy).toBe("fallback");
    expect(run.proposals.length).toBeGreaterThan(0);
    expect(run.steps[0]?.tool).toBe("get_pipeline_overview");
  });
});

describe("candidate input", () => {
  it("derives a clean name from a résumé file name", () => {
    expect(nameFromFileName("john_doe-CV (2).pdf")).toBe("John Doe");
    expect(nameFromFileName("Resume - Priya Natarajan.docx")).toBe("Priya Natarajan");
  });
});
