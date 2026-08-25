import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Download, Filter, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

const statusTone: Record<string, string> = {
  requested: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  approved: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  rejected: "border-rose-300/20 bg-rose-300/10 text-rose-100",
  executed: "border-violet-300/20 bg-violet-300/10 text-violet-100",
  closed: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
};

function downloadReport(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

export default function OperationalRecordsPanel() {
  const [assetTag, setAssetTag] = useState("P-101");
  const [scenario, setScenario] = useState("all");
  const [status, setStatus] = useState("all");
  const [window, setWindow] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const historyInput = useMemo(() => ({ assetTag: assetTag || undefined, scenario: scenario === "all" ? undefined : scenario, status: status === "all" ? undefined : status as "requested" | "approved" | "rejected" | "executed" | "closed", from: window === "24h" ? Date.now() - 24 * 60 * 60_000 : window === "7d" ? Date.now() - 7 * 24 * 60 * 60_000 : undefined }), [assetTag, scenario, status, window]);
  const calibrations = trpc.operations.calibrations.useQuery({ assetTag: assetTag || undefined });
  const history = trpc.operations.faultTestHistory.useQuery(historyInput);
  const report = trpc.operations.faultTestReport.useQuery({ requestId: selectedRequest ?? 1 }, { enabled: selectedRequest !== null });

  return <div className="grid gap-6 xl:grid-cols-[.92fr_1.08fr]">
    <Card className="surface-card"><CardHeader className="border-b border-white/7 pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base text-white"><ShieldCheck className="h-4 w-4 text-cyan-200" /> Calibration status</CardTitle><p className="mt-1 text-xs text-slate-500">Active revision visibility for the selected hardware asset.</p></div><Button size="sm" variant="outline" onClick={() => calibrations.refetch()} className="border-white/10 bg-white/[.03] text-slate-200 hover:bg-white/[.08]">Refresh</Button></div></CardHeader><CardContent className="space-y-3 p-4"><Input value={assetTag} onChange={event => setAssetTag(event.target.value)} aria-label="Calibration asset tag" placeholder="Asset tag" />{calibrations.data?.length ? calibrations.data.map(item => <div key={item.id} className="rounded-xl border border-emerald-300/15 bg-emerald-300/[.04] p-4"><div className="flex items-center justify-between gap-2"><p className="font-mono text-sm font-medium text-slate-100">{item.sensorKey}</p><Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">{item.status}</Badge></div><p className="mt-2 text-xs text-slate-400">{item.metric} · {item.unit} · {item.revision}</p><p className="mt-1 text-xs text-slate-500">Range {item.rangeMin}–{item.rangeMax} · valid until {new Date(item.validUntil).toLocaleDateString()}</p></div>) : <div className="rounded-xl border border-white/7 bg-white/[.02] p-4 text-sm leading-6 text-slate-400">No active calibration records are listed. The bridge will reject physical telemetry until an administrator creates the matching revision.</div>}</CardContent></Card>
    <Card className="surface-card"><CardHeader className="border-b border-white/7 pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base text-white"><Filter className="h-4 w-4 text-cyan-200" /> Filtered event history</CardTitle><p className="mt-1 text-xs text-slate-500">Query the persisted controlled-test record by asset, scenario, state, and time window.</p></div><Badge className="border-white/10 bg-white/5 text-slate-300">{history.data?.length ?? 0} results</Badge></div></CardHeader><CardContent className="space-y-3 p-4"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><Input value={assetTag} onChange={event => setAssetTag(event.target.value)} aria-label="History asset tag" placeholder="Asset tag" /><select value={scenario} onChange={event => setScenario(event.target.value)} className="h-10 rounded-md border border-white/10 bg-[#0a1823] px-3 text-sm text-slate-100"><option value="all">All scenarios</option><option value="bearing">Bearing</option><option value="valveRestriction">Valve restriction</option><option value="sensorDrift">Sensor drift</option><option value="reducedFlow">Reduced flow</option></select><select value={status} onChange={event => setStatus(event.target.value)} className="h-10 rounded-md border border-white/10 bg-[#0a1823] px-3 text-sm text-slate-100"><option value="all">All states</option><option value="requested">Requested</option><option value="approved">Approved</option><option value="executed">Executed</option><option value="closed">Closed</option><option value="rejected">Rejected</option></select><select value={window} onChange={event => setWindow(event.target.value)} className="h-10 rounded-md border border-white/10 bg-[#0a1823] px-3 text-sm text-slate-100"><option value="all">All time</option><option value="24h">Next 24 hours</option><option value="7d">Next 7 days</option></select></div>{history.data?.length ? history.data.map(item => <div key={item.id} className="rounded-xl border border-white/7 bg-white/[.02] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium text-slate-100">#{item.id} · {item.assetTag} · {item.scenario}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.scheduledAt).toLocaleString()} · {item.riskLevel} risk · no actuation</p></div><div className="flex items-center gap-2"><Badge className={statusTone[item.status] ?? "border-white/10 bg-white/5 text-slate-400"}>{item.status}</Badge><Button size="sm" variant="outline" onClick={() => setSelectedRequest(item.id)} className="border-white/10 bg-white/[.03] text-slate-200 hover:bg-white/[.08]">Select</Button></div></div></div>) : <p className="rounded-xl border border-white/7 bg-white/[.02] p-4 text-sm text-slate-400">No persisted records match the active filters.</p>}{report.data && <Button className="w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={() => downloadReport(report.data!.filename, report.data!.markdown)}><Download className="mr-2 h-4 w-4" />Download selected test record</Button>}</CardContent></Card>
  </div>;
}
