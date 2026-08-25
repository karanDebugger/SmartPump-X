import { Button } from "@/components/ui/button";
import { useSimulation } from "@/contexts/SimulationContext";
import { simulationInputBounds, simulationInputDefaults, type SimulationInputs } from "@shared/smartPump";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

const fields = Object.entries(simulationInputBounds) as Array<[keyof SimulationInputs, (typeof simulationInputBounds)[keyof typeof simulationInputBounds]]>;

export default function SimulationControls() {
  const { inputs, setInput, resetInputs } = useSimulation();
  const [drafts, setDrafts] = useState<Record<keyof SimulationInputs, string>>(() => ({ rpm: String(inputs.rpm), staticHeadM: String(inputs.staticHeadM), resistanceMultiplier: String(inputs.resistanceMultiplier), inletTemperatureC: String(inputs.inletTemperatureC) }));
  useEffect(() => setDrafts({ rpm: String(inputs.rpm), staticHeadM: String(inputs.staticHeadM), resistanceMultiplier: String(inputs.resistanceMultiplier), inletTemperatureC: String(inputs.inletTemperatureC) }), [inputs]);
  const commit = (key: keyof SimulationInputs) => {
    const parsed = Number(drafts[key]);
    setInput(key, parsed);
  };
  return <section id="simulation-inputs" className="mx-4 mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.035] p-5 sm:mx-6 sm:mt-6 lg:mx-8 lg:p-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><div className="flex items-center gap-2 text-sm font-semibold text-white"><SlidersHorizontal className="h-4 w-4 text-cyan-200" /> Adjustable simulation inputs</div><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Change the bounded synthetic inputs below to recalculate the digital twin. These controls never write telemetry, publish MQTT messages, or operate hardware.</p></div><Button variant="outline" onClick={resetInputs} className="border-white/12 bg-white/[.035] text-slate-200 hover:bg-white/[.08] hover:text-white"><RotateCcw className="mr-2 h-4 w-4" />Reset baseline</Button></div><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{fields.map(([key, config]) => <label key={key} className="rounded-xl border border-white/8 bg-[#081821]/80 p-4"><span className="text-[11px] font-medium uppercase tracking-[.13em] text-slate-400">{config.label}</span><div className="mt-3 flex items-center gap-2"><input type="text" inputMode="decimal" value={drafts[key]} onChange={event => setDrafts(current => ({ ...current, [key]: event.target.value }))} onBlur={() => commit(key)} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} className="h-10 w-full rounded-md border border-white/10 bg-white/[.035] px-3 text-sm font-medium text-white outline-none ring-cyan-300/40 transition focus:ring-2" aria-label={config.label} /><span className="whitespace-nowrap text-xs text-slate-500">{config.unit}</span></div><p className="mt-2 text-[11px] text-slate-500">Range {config.min}–{config.max}</p></label>)}</div><p className="mt-4 text-xs leading-5 text-cyan-100/80">Values are local to this browser session and labelled synthetic. Use Reset baseline to return to the documented demonstration inputs.</p></section>;
}
