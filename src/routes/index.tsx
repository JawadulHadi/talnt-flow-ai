import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useAtsStore } from "@/stores/ats-store";
import {
  bottleneck, diversity, formatEuro, formatNumber, funnel, kpis, sourceEffectiveness, stageVelocity,
} from "@/lib/ats/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recruitment analytics — Qeloma Agent for Recruiter" },
      { name: "description", content: "Live time-to-hire, source effectiveness, funnel and diversity metrics for your hiring pipeline." },
      { property: "og:title", content: "Recruitment analytics — Qeloma Agent for Recruiter" },
      { property: "og:description", content: "Live time-to-hire, source effectiveness, funnel and diversity metrics." },
    ],
  }),
  component: AnalyticsPage,
});

const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" };
const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="glass p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p key={value} className="mt-2 font-display text-4xl text-foreground animate-in fade-in zoom-in-95">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`glass p-5 ${className}`}>
      <h2 className="text-lg text-foreground">{title}</h2>
      {subtitle && <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>}
      {children}
    </section>
  );
}

function AnalyticsPage() {
  const candidates = useAtsStore((s) => s.candidates);
  const k = useMemo(() => kpis(candidates), [candidates]);
  const velocity = useMemo(() => stageVelocity(candidates), [candidates]);
  const sources = useMemo(() => sourceEffectiveness(candidates), [candidates]);
  const f = useMemo(() => funnel(candidates), [candidates]);
  const b = useMemo(() => bottleneck(candidates), [candidates]);
  const dni = useMemo(() => diversity(candidates), [candidates]);
  const hireShare = sources.filter((s) => s.hired > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Executive overview</p>
          <h1 className="text-4xl text-foreground md:text-5xl">Hiring, at a glance</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">Every chart updates the moment a candidate moves stage in the pipeline.</p>
        </div>
        <Link to="/pipeline" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
          Open pipeline <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active candidates" value={formatNumber(k.total)} hint={`${k.hired} hired so far`} />
        <Kpi label="Time to fill" value={`${formatNumber(k.timeToFill)} d`} hint="Average from sourced to hired" />
        <Kpi label="Interview → offer" value={`${k.interviewToOffer}%`} hint="Share of interviewed who got an offer" />
        <Kpi label="Offer acceptance" value={`${k.offerAcceptance}%`} hint="Offers that became hires" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Time to hire by stage" subtitle="Average days spent in each stage" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={velocity}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="stage" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${formatNumber(v, 1)} days`, "Average"]} />
                <Bar dataKey="days" radius={[8, 8, 0, 0]} animationDuration={700}>
                  {velocity.map((_, i) => <Cell key={i} fill={chartColors[i % 5]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Hire share by source" subtitle="Where your hires come from">
          <div className="h-64">
            {hireShare.length === 0 ? (
              <p className="pt-20 text-center text-sm text-muted-foreground">No hires yet — move someone to Hired.</p>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={hireShare} dataKey="hired" nameKey="source" innerRadius={55} outerRadius={85} paddingAngle={3} animationDuration={700}>
                    {hireShare.map((s) => <Cell key={s.source} fill={chartColors[sources.indexOf(s) % 5]} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pipeline funnel" subtitle="Candidates reaching each stage, with stage-to-stage conversion">
          <div className="space-y-3">
            {f.map((s, i) => (
              <div key={s.stage}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-foreground">{s.stage}</span>
                  <span className="text-muted-foreground">{s.reached} {i > 0 && `· ${s.conversion}%`}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${f[0]!.reached ? (s.reached / f[0]!.reached) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3 rounded-xl border border-border bg-secondary/60 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent" />
            <p className="text-secondary-foreground">
              <strong>Bottleneck audit:</strong> the weakest step is into <strong>{b.stage}</strong> at {b.conversion}% conversion. Review screening criteria or interviewer availability for this stage.
            </p>
          </div>
        </Panel>
        <Panel title="Channel conversion and sourcing ROI" subtitle="Interview conversion and cost per hire by channel">
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={sources} layout="vertical">
                <XAxis type="number" domain={[0, 100]} {...axis} unit="%" />
                <YAxis type="category" dataKey="source" width={70} {...axis} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Conversion"]} />
                <Bar dataKey="conversion" radius={[0, 8, 8, 0]} fill="var(--chart-2)" animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-1">Source</th><th>Spend</th><th>Hires</th><th>Cost per hire</th></tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.source} className="border-t border-border text-foreground">
                  <td className="py-1.5">{s.source}</td>
                  <td>{formatEuro(s.cost)}</td>
                  <td>{s.hired}</td>
                  <td>{s.costPerHire === null ? "—" : formatEuro(s.costPerHire)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title="Diversity and inclusion" subtitle="Representation among candidates who reached each stage">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={dni}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="stage" {...axis} />
              <YAxis {...axis} unit="%" domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="women" name="Women" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="nonBinary" name="Non-binary" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="underrepresented" name="Under-represented groups" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
