import { createServerFn } from "@tanstack/react-start";
import {
  AGENT_LIMITS,
  type AgentRun,
  type AgentSnapshot,
  type ScorecardInput,
  type ScorecardNarrative,
} from "./agent";

/**
 * Server functions for the TalntFlow Agent. Claude is enabled by setting ANTHROPIC_API_KEY
 * on the server; without it every call returns null and the client uses its local engine.
 */

const configured = () => Boolean(process.env["ANTHROPIC_API_KEY"]);

function fail(message: string): never {
  throw new Error(`Invalid agent request: ${message}`);
}

export const getAgentStatus = createServerFn({ method: "GET" }).handler(async () => ({
  configured: configured(),
}));

export const runAgentTask = createServerFn({ method: "POST" })
  .validator((input: { task: string; snapshot: AgentSnapshot }) => {
    const task = typeof input?.task === "string" ? input.task.trim() : "";
    if (!task || task.length > AGENT_LIMITS.taskChars) fail("task must be 1–2000 characters");
    const s = input.snapshot;
    if (!s || !Array.isArray(s.candidates) || !Array.isArray(s.jobs)) fail("snapshot is malformed");
    if (s.candidates.length > AGENT_LIMITS.candidates) fail("too many candidates");
    if (Number.isNaN(Date.parse(s.now))) fail("snapshot.now is not a date");
    return { task, snapshot: s };
  })
  .handler(async ({ data }): Promise<AgentRun | null> => {
    if (!configured()) return null;
    const { runClaudeAgent } = await import("./agent.server");
    return runClaudeAgent(data.task, data.snapshot);
  });

export const summarizeScorecard = createServerFn({ method: "POST" })
  .validator((input: ScorecardInput) => {
    if (typeof input?.candidateName !== "string" || !Array.isArray(input.items)) {
      fail("scorecard is malformed");
    }
    if (input.items.length > 30) fail("too many questions");
    return input;
  })
  .handler(async ({ data }): Promise<ScorecardNarrative | null> => {
    if (!configured()) return null;
    const { summarizeScorecardWithClaude } = await import("./agent.server");
    return summarizeScorecardWithClaude(data);
  });
