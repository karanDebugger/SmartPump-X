import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TelemetryQualitySummary } from "@shared/operations";
import { Radio, ShieldCheck } from "lucide-react";

const statusTone: Record<TelemetryQualitySummary["status"], string> = {
  nominal: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  attention: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  unavailable: "border-slate-300/15 bg-slate-300/[.06] text-slate-200",
};

function formatSample(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export default function TelemetryQualityPanel({ summary }: { summary?: TelemetryQualitySummary }) {
  return <div id="telemetry-quality" className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
    <Card className="surface-card"><CardHeader className="border-b border-white/7 pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base text-white"><Radio className="h-4 w-4 text-cyan-200" /> Telemetry quality</CardTitle><p className="mt-1 text-xs text-slate-500">Protected summary of accepted bridge measurements for P-101.</p></div><Badge className={summary ? statusTone[summary.status] : statusTone.unavailable}>{summary?.status ?? "loading"}</Badge></div></CardHeader><CardContent className="p-5"><p className="text-4xl font-semibold tracking-tight text-white">{summary?.acceptedSamples ?? "—"}</p><p className="mt-2 text-xs uppercase tracking-[.14em] text-slate-500">accepted samples</p><p className="mt-5 text-sm leading-6 text-slate-300">{summary?.summary ?? "Loading protected telemetry diagnostics…"}</p><div className="mt-5 flex flex-wrap gap-2">{summary?.qualityBreakdown.map(item => <span key={item.quality} className="rounded-md border border-white/10 bg-white/[.03] px-2 py-1 text-xs text-slate-300">{item.quality}: {item.count}</span>)}</div></CardContent></Card>
    <Card className="surface-card"><CardHeader className="border-b border-white/7 pb-4"><CardTitle className="text-base text-white">Bridge safeguards and latest values</CardTitle><p className="mt-1 text-xs text-slate-500">Accepted records are shown separately from explicit bridge rejection safeguards.</p></CardHeader><CardContent className="p-0">{summary?.metrics.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><caption className="sr-only">Latest accepted telemetry values by metric</caption><thead className="border-b border-white/7 text-[10px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3 font-medium">Metric</th><th className="px-4 py-3 font-medium">Latest accepted value</th><th className="px-4 py-3 font-medium">Quality</th><th className="px-5 py-3 text-right font-medium">Samples</th></tr></thead><tbody>{summary.metrics.map(metric => <tr key={metric.metric} className="border-b border-white/[.05] last:border-0"><td className="px-5 py-3 font-medium text-slate-200">{metric.metric}</td><td className="px-4 py-3 text-white">{formatSample(metric.latestValue)} {metric.unit}</td><td className="px-4 py-3 text-slate-400">{metric.quality}</td><td className="px-5 py-3 text-right text-slate-300">{metric.samples}</td></tr>)}</tbody></table></div> : <div className="p-5 text-sm leading-6 text-slate-400">No accepted measurement telemetry has been recorded. The public dashboard is intentionally still driven by synthetic data.</div>}<div className="border-t border-white/7 bg-cyan-300/[.03] p-5"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-cyan-200">Rejection safeguards</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{summary?.rejectionGuards.map(guard => <p key={guard} className="flex gap-2 text-xs leading-5 text-slate-300"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-200" />{guard}</p>)}</div><p className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[.04] p-3 text-xs leading-5 text-amber-100">{summary?.notice ?? "Rejected bridge payloads are never persisted as telemetry."}</p></div></CardContent></Card>
  </div>;
}
