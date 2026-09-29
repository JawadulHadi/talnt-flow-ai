import type { Candidate, Source, Stage } from "./types";
import { SOURCES, STAGES } from "./types";

const DAY = 86_400_000;

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

/** Days since the candidate entered their current stage. */
export function daysInStage(
  c: Pick<Candidate, "stageHistory" | "appliedDate">,
  now = Date.now(),
): number {
  const last = c.stageHistory[c.stageHistory.length - 1]?.at ?? c.appliedDate;
  return Math.max(0, Math.floor((now - new Date(last).getTime()) / DAY));
}

/** Applications still in play: not rejected and not yet hired. */
export const isOpenApplication = (c: Pick<Candidate, "rejection" | "stage">) =>
  !c.rejection && c.stage !== "Hired";

export function funnel(candidates: Pick<Candidate, "stage">[]) {
  return STAGES.map((stage, i) => {
    const reached = candidates.filter((c) => stageIndex(c.stage) >= i).length;
    const current = candidates.filter((c) => c.stage === stage).length;
    const prev = i === 0 ? reached : candidates.filter((c) => stageIndex(c.stage) >= i - 1).length;
    return {
      stage,
      reached,
      current,
      conversion: prev === 0 ? 0 : Math.round((reached / prev) * 100),
    };
  });
}

/** Average days spent in each stage, from recorded stage movements. */
export function stageVelocity(candidates: Pick<Candidate, "stageHistory">[], now = Date.now()) {
  return STAGES.slice(0, -1).map((stage) => {
    const durations: number[] = [];
    for (const c of candidates) {
      const h = c.stageHistory;
      const i = h.findIndex((m) => m.stage === stage);
      if (i === -1) continue;
      const start = new Date(h[i]!.at).getTime();
      const end = h[i + 1] ? new Date(h[i + 1]!.at).getTime() : now;
      durations.push((end - start) / DAY);
    }
    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    return { stage, days: Math.round(avg * 10) / 10 };
  });
}

export function sourceEffectiveness(candidates: Candidate[]) {
  const hires = candidates.filter((c) => c.stage === "Hired").length;
  return SOURCES.map((source: Source) => {
    const list = candidates.filter((c) => c.source === source);
    const hired = list.filter((c) => c.stage === "Hired").length;
    const interviewed = list.filter((c) => stageIndex(c.stage) >= 2).length;
    const cost = list.reduce((a, c) => a + c.sourcingCost, 0);
    return {
      source,
      candidates: list.length,
      hired,
      interviewed,
      conversion: list.length ? Math.round((interviewed / list.length) * 100) : 0,
      hireShare: hires ? Math.round((hired / hires) * 100) : 0,
      cost,
      costPerHire: hired ? Math.round(cost / hired) : null,
    };
  });
}

export function kpis(
  candidates: Pick<Candidate, "stage" | "stageHistory" | "appliedDate" | "rejection">[],
) {
  const hired = candidates.filter((c) => c.stage === "Hired");
  const ttf = hired.map((c) => {
    const first = new Date(c.stageHistory[0]?.at ?? c.appliedDate).getTime();
    const last = new Date(c.stageHistory[c.stageHistory.length - 1]?.at ?? c.appliedDate).getTime();
    return (last - first) / DAY;
  });
  const interviewed = candidates.filter((c) => stageIndex(c.stage) >= 2).length;
  const offers = candidates.filter((c) => stageIndex(c.stage) >= 3).length;
  return {
    active: candidates.filter(isOpenApplication).length,
    hired: hired.length,
    timeToFill: ttf.length ? Math.round(ttf.reduce((a, b) => a + b, 0) / ttf.length) : 0,
    interviewToOffer: interviewed ? Math.round((offers / interviewed) * 100) : 0,
    offerAcceptance: offers ? Math.round((hired.length / offers) * 100) : 0,
  };
}

export function bottleneck(candidates: Pick<Candidate, "stage">[]) {
  const f = funnel(candidates).slice(1);
  return f.reduce((worst, s) => (s.conversion < worst.conversion ? s : worst), f[0]!);
}

/**
 * Representation per stage, computed only over candidates who voluntarily disclosed
 * the attribute — undisclosed candidates never count towards any group.
 */
export function diversity(candidates: Candidate[]) {
  return STAGES.map((stage, i) => {
    const list = candidates.filter((c) => stageIndex(c.stage) >= i);
    const genders = list.filter((c) => c.gender !== undefined);
    const urg = list.filter((c) => c.underrepresented !== undefined);
    const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);
    return {
      stage,
      women: pct(genders.filter((c) => c.gender === "Woman").length, genders.length),
      nonBinary: pct(genders.filter((c) => c.gender === "Non-binary").length, genders.length),
      underrepresented: pct(urg.filter((c) => c.underrepresented).length, urg.length),
      disclosed: pct(genders.length, list.length),
    };
  });
}

export const formatNumber = (n: number, digits = 0) =>
  new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);

export const formatEuro = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

/** "just now", "12 min ago", "3 h ago", "5 d ago". */
export function timeAgo(iso: string, now = Date.now()): string {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

/** DD/MM/YYYY */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
