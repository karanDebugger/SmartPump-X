import type { ScenarioKind, SimulationInputs, TrendPoint } from "../shared/smartPump";
import { createTrend } from "./pumpEngine";

/**
 * Version-controlled, deterministic synthetic telemetry artifact for interface,
 * contract and workflow validation. This does not represent measured data.
 */
export const DEMO_DATASET_VERSION = "smartpump-x-v1";
export const DEMO_EPOCH_MS = Date.UTC(2025, 0, 1, 0, 0, 0);

export function createDeterministicDemoTrend(scenario: ScenarioKind, windowMinutes: number, inputOverrides: Partial<SimulationInputs> = {}): TrendPoint[] {
  const liveTrend = createTrend(scenario, windowMinutes, inputOverrides);
  const offset = DEMO_EPOCH_MS - liveTrend[liveTrend.length - 1]!.timestamp;
  return liveTrend.map(point => ({ ...point, timestamp: point.timestamp + offset }));
}
