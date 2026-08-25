import { simulationInputBounds, simulationInputDefaults, type SimulationInputs } from "@shared/smartPump";
import { createContext, useContext, useMemo, useState } from "react";

type SimulationContextValue = {
  inputs: SimulationInputs;
  setInput: (key: keyof SimulationInputs, value: number) => void;
  resetInputs: () => void;
};

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [inputs, setInputs] = useState<SimulationInputs>(simulationInputDefaults);
  const value = useMemo<SimulationContextValue>(() => ({
    inputs,
    setInput: (key, value) => {
      const bounds = simulationInputBounds[key];
      const fallback = simulationInputDefaults[key];
      const normalized = Number.isFinite(value) ? Math.min(Math.max(value, bounds.min), bounds.max) : fallback;
      setInputs(current => ({ ...current, [key]: normalized }));
    },
    resetInputs: () => setInputs(simulationInputDefaults),
  }), [inputs]);
  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("useSimulation must be used within SimulationProvider");
  return context;
}
