import type { Candidate, Source, Stage } from "./types";
import { SOURCES, STAGES } from "./types";

const DAY = 86_400_000;

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

export function funnel(candidates: Candidate[]) {
  return STAGES.map((stage, i) => {
    const reached = candidates.filter((c) => stageIndex(c.stage) >= i).length;
    const current = candidates.filter((c) => c.stage === stage).length;
    const prev = i === 0 ? reached : candidates.filter((c) => stageIndex(c.stage) >= i - 1).length;
    return { stage, reached, current, conversion: prev === 0 ? 0 : Math.round((reached / prev) * 100) };
  });
}

/** Average days spent in each stage, from recorded stage movements. */
export function stageVelocity(candidates: Candidate[], now = Date.now()) {
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

export function kpis(candidates: Candidate[]) {
  const hired = candidates.filter((c) => c.stage === "Hired");
  const ttf = hired.map((c) => {
    const first = new Date(c.stageHistory[0]?.at ?? c.appliedDate).getTime();
    const last = new Date(c.stageHistory[c.stageHistory.length - 1]?.at ?? c.appliedDate).getTime();
    return (last - first) / DAY;
  });
  const interviewed = candidates.filter((c) => stageIndex(c.stage) >= 2).length;
  const offers = candidates.filter((c) => stageIndex(c.stage) >= 3).length;
  return {
    total: candidates.length,
    hired: hired.length,
    timeToFill: ttf.length ? Math.round(ttf.reduce((a, b) => a + b, 0) / ttf.length) : 0,
    interviewToOffer: interviewed ? Math.round((offers / interviewed) * 100) : 0,
    offerAcceptance: offers ? Math.round((hired.length / offers) * 100) : 0,
  };
}

export function bottleneck(candidates: Candidate[]) {
  const f = funnel(candidates).slice(1);
  return f.reduce((worst, s) => (s.conversion < worst.conversion ? s : worst), f[0]!);
}

export function diversity(candidates: Candidate[]) {
  return STAGES.map((stage, i) => {
    const list = candidates.filter((c) => stageIndex(c.stage) >= i);
    const pct = (n: number) => (list.length ? Math.round((n / list.length) * 100) : 0);
    return {
      stage,
      women: pct(list.filter((c) => c.gender === "Woman").length),
      nonBinary: pct(list.filter((c) => c.gender === "Non-binary").length),
      underrepresented: pct(list.filter((c) => c.underrepresented).length),
    };
  });
}

export const formatNumber = (n: number, digits = 0) =>
  new Intl.NumberFormat("de-DE", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);

export const formatEuro = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/** DD/MM/YYYY */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
