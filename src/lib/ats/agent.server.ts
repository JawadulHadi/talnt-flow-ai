import Anthropic from "@anthropic-ai/sdk";
import {
  AGENT_EMAIL_TEMPLATES,
  createAgentSession,
  type AgentRun,
  type AgentSnapshot,
  type ScorecardInput,
  type ScorecardNarrative,
} from "./agent";
import { STAGES } from "./types";

/**
 * Server-only Claude integration. Loaded lazily from agent.functions.ts so the SDK and
 * the API key never reach the browser bundle.
 */

const MODEL = "claude-opus-5-5";
const MAX_STEPS = 8;
// Retry on Anthropic's recommended model if a safety classifier declines a request.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

const client = () => new Anthropic({ timeout: 120_000, maxRetries: 1 });

const candidateId = { type: "string", description: "Candidate id, e.g. cand-3." };
const rationale = {
  type: "string",
  description: "One sentence citing the facts behind this proposal. Shown to the recruiter.",
};

const tools: Anthropic.Beta.BetaTool[] = [
  {
    name: "get_pipeline_overview",
    description:
      "Pipeline KPIs, stage funnel with conversion rates, the weakest stage, and open applications per job by stage. Start here.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "list_candidates",
    description:
      "List candidates as compact rows (match score, days in current stage, feedback, last email, scorecard), longest-waiting first, at most 50.",
    input_schema: {
      type: "object",
      properties: {
        jobId: { type: "string", description: 'Job id to filter by, or "" for all jobs.' },
        stage: { type: "string", enum: [...STAGES, "Any"] },
        minDaysInStage: { type: "integer", description: "0 for no minimum." },
        includeRejected: { type: "boolean" },
      },
      required: ["jobId", "stage", "minDaysInStage", "includeRejected"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_candidate",
    description:
      "Full record for one candidate: stage history, skills, strengths, gaps and recent team feedback.",
    input_schema: {
      type: "object",
      properties: { candidateId },
      required: ["candidateId"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "propose_stage_move",
    description:
      "Propose moving a candidate to another stage. Moving to Screened, Interviewing or Offer Sent also sends that stage's standard email once approved.",
    input_schema: {
      type: "object",
      properties: { candidateId, toStage: { type: "string", enum: [...STAGES] }, rationale },
      required: ["candidateId", "toStage", "rationale"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "propose_email",
    description:
      "Propose sending a standard email: reminder (upcoming interview) or feedback (status update).",
    input_schema: {
      type: "object",
      properties: {
        candidateId,
        template: { type: "string", enum: [...AGENT_EMAIL_TEMPLATES] },
        rationale,
      },
      required: ["candidateId", "template", "rationale"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "propose_note",
    description:
      "Propose adding an internal note to the candidate's profile, e.g. to flag a concern or a follow-up for the hiring team.",
    input_schema: {
      type: "object",
      properties: { candidateId, note: { type: "string" }, rationale },
      required: ["candidateId", "note", "rationale"],
      additionalProperties: false,
    },
    strict: true,
  },
];

const SYSTEM = `You are TalntFlow Agent, a recruiting operations assistant inside an applicant tracking system. You work over a read-only snapshot of the hiring pipeline and use tools to look things up. You can't change anything directly: stage moves, emails and notes are proposals that a recruiter reviews before anything happens.

How to work:
- Check the data before recommending anything, and base each proposal on specific facts such as days in stage, match score, scorecard results or team feedback. Put those facts in the rationale.
- Propose only actions that clearly move hiring forward. Proposing nothing is a fine outcome.
- You cannot reject candidates. If someone looks like a poor fit, add a note that explains the concern so a person can decide.
- Judge candidates only on job-relevant evidence. The snapshot has no contact details or demographic data, so don't guess at either.
- Finish with a short plain-text summary for the recruiter, under 150 words: what you checked, what you proposed and why, and anything that needs their judgement.`;

export async function runClaudeAgent(task: string, snapshot: AgentSnapshot): Promise<AgentRun> {
  const anthropic = client();
  const session = createAgentSession(snapshot);
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: `Today is ${snapshot.now.slice(0, 10)}.\n\nTask: ${task}` },
  ];

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await anthropic.beta.messages.create({
      ...FALLBACK,
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      system: SYSTEM,
      tools,
      messages,
    });
    if (res.stop_reason === "refusal") {
      return session.result("The agent declined this request. Try rephrasing the task.", "ai");
    }
    messages.push({ role: "assistant", content: res.content });

    const toolUses = res.content.filter(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
    );
    if (res.stop_reason !== "tool_use" || toolUses.length === 0) {
      const text = res.content
        .flatMap((b) => (b.type === "text" ? [b.text] : []))
        .join("\n")
        .trim();
      return session.result(text || "Done — see the proposals below.", "ai");
    }

    // All results for one turn go back in a single user message.
    messages.push({
      role: "user",
      content: toolUses.map((t) => {
        const r = session.execute(t.name, t.input);
        return { type: "tool_result", tool_use_id: t.id, content: r.content, is_error: r.isError };
      }),
    });
  }
  return session.result(
    `Stopped after ${MAX_STEPS} steps. Review the proposals gathered so far.`,
    "ai",
  );
}

/** Writes the narrative parts of a recommendation. Score and verdict stay deterministic. */
export async function summarizeScorecardWithClaude(
  input: ScorecardInput,
): Promise<ScorecardNarrative | null> {
  const res = await client().beta.messages.create({
    ...FALLBACK,
    model: MODEL,
    max_tokens: 16000,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            executiveSummary: { type: "string" },
            keyStrengths: { type: "array", items: { type: "string" } },
            areasToProbe: { type: "array", items: { type: "string" } },
          },
          required: ["executiveSummary", "keyStrengths", "areasToProbe"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `Summarise this structured STAR interview scorecard for a hiring panel.

The weighted score (${input.weightedScore}/100) and verdict ("${input.verdict}") are already calculated; don't restate different numbers. Write a 2–3 sentence executive summary, up to 3 key strengths and up to 3 areas to probe in the next round, each grounded in the ratings and interviewer notes. Unrated questions have score 0.

Candidate: ${input.candidateName}, applying for ${input.role}.
Ratings (score 1–5):
${JSON.stringify(input.items, null, 1)}`,
      },
    ],
  });
  if (res.stop_reason === "refusal") return null;
  const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const out = JSON.parse(text) as ScorecardNarrative;
  return {
    executiveSummary: out.executiveSummary,
    keyStrengths: out.keyStrengths.slice(0, 3),
    areasToProbe: out.areasToProbe.slice(0, 3),
  };
}
