import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScenarioComparison, TwinSnapshot } from "@shared/smartPump";
import { ArrowDownRight, ArrowUpRight, CircleAlert, Scale, ShieldCheck } from "lucide-react";

const envelopeStyle = {
  preferred: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  caution: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  outside: "border-rose-300/20 bg-rose-300/10 text-rose-100",
} as const;

function value(value: number, decimals = 1) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value);
}

export default function EngineeringInsightsPanel({ snapshot, comparison }: { snapshot: TwinSnapshot; comparison?: ScenarioComparison }) {
  return (
    <section id="scenario-comparison" aria-label="Advanced engineering insights" className="mt-6 grid gap-6 xl:grid-cols-[.86fr_1.14fr]">
      <Card aria-labelledby="envelope-heading" className="surface-card">
        <CardHeader className="border-b border-white/7 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle id="envelope-heading" className="flex items-center gap-2 text-base text-white"><ShieldCheck className="h-4 w-4 text-cyan-200" /> Operating-envelope assessment</CardTitle>
              <p className="mt-1 text-xs text-slate-500">Transparent guardrails for the synthetic model, evaluated at the active operating point.</p>
            </div>
            <Badge className={envelopeStyle[snapshot.operatingEnvelope.status]}>{snapshot.operatingEnvelope.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <p aria-live="polite" className="text-sm leading-6 text-slate-300">{snapshot.operatingEnvelope.summary}</p>
          <div className="mt-5 space-y-3">
            {snapshot.operatingEnvelope.checks.map(check => (
              <div key={check.key} className="rounded-xl border border-white/7 bg-white/[.02] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{check.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{check.guidance}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={envelopeStyle[check.status]}>{check.status}</Badge>
                    <p className="mt-2 text-sm font-semibold text-white">{value(check.value, check.key === "vibration" || check.key === "npsh" ? 2 : 1)} <span className="text-xs font-medium text-slate-500">{check.unit}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-3 text-xs leading-5 text-amber-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{snapshot.operatingEnvelope.notice}</div>
        </CardContent>
      </Card>

      <Card aria-labelledby="comparison-heading" className="surface-card">
        <CardHeader className="border-b border-white/7 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle id="comparison-heading" className="flex items-center gap-2 text-base text-white"><Scale className="h-4 w-4 text-cyan-200" /> Scenario impact comparison</CardTitle>
              <p className="mt-1 text-xs text-slate-500">Normal synthetic baseline versus the active condition at the exact same visible inputs.</p>
            </div>
            {comparison && <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">{comparison.candidate.scenarioLabel}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {comparison ? <>
            <div aria-live="polite" className="border-b border-white/7 bg-white/[.02] px-5 py-4 text-sm leading-6 text-slate-300">{comparison.summary}</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs">
                <caption className="sr-only">Synthetic scenario comparison at the active simulation inputs</caption>
                <thead className="border-b border-white/7 text-[10px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3 font-medium">Metric</th><th className="px-4 py-3 font-medium">Baseline</th><th className="px-4 py-3 font-medium">Active condition</th><th className="px-5 py-3 text-right font-medium">Change</th></tr></thead>
                <tbody>{comparison.deltas.map(delta => {
                  const isIncrease = delta.change >= 0;
                  const decimals = delta.key === "head" || delta.key === "npshMargin" ? 2 : 1;
                  return <tr key={delta.key} className="border-b border-white/[.05] last:border-0"><td className="px-5 py-3 font-medium text-slate-200">{delta.label}</td><td className="px-4 py-3 text-slate-400">{value(delta.baseline, decimals)} {delta.unit}</td><td className="px-4 py-3 text-white">{value(delta.candidate, decimals)} {delta.unit}</td><td className={`px-5 py-3 text-right font-medium ${isIncrease ? "text-cyan-200" : "text-amber-200"}`}><span className="inline-flex items-center gap-1">{isIncrease ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{isIncrease ? "+" : ""}{value(delta.change, decimals)}</span></td></tr>;
                })}</tbody>
              </table>
            </div>
            <div className="border-t border-white/7 bg-cyan-300/[.03] px-5 py-3 text-xs leading-5 text-cyan-100">{comparison.scopeNotice}</div>
          </> : <div className="p-5 text-sm text-slate-400">Loading transparent baseline comparison…</div>}
        </CardContent>
      </Card>
    </section>
  );
}
