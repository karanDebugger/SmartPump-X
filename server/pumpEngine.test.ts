import { describe, expect, it } from "vitest";
import { createScenarioComparison, createSnapshot, createTrend } from "./pumpEngine";

describe("SmartPump-X hydraulic digital twin", () => {
  it("returns a coherent healthy operating point with positive hydraulic power", () => {
    const snapshot = createSnapshot("normal");
    expect(snapshot.health.band).toBe("healthy");
    expect(snapshot.sensors.flow.value).toBeGreaterThan(0);
    expect(snapshot.calculations.headM).toBeGreaterThan(0);
    expect(snapshot.calculations.hydraulicPowerW).toBeGreaterThan(0);
    expect(snapshot.calculations.electricalInputW).toBeGreaterThan(snapshot.calculations.hydraulicPowerW);
    expect(snapshot.calculations.wireToWaterEfficiencyPct).toBeGreaterThan(0);
    expect(snapshot.calculations.wireToWaterEfficiencyPct).toBeLessThan(100);
  });

  it("degrades health and elevates vibration for the bearing signature", () => {
    const healthy = createSnapshot("normal");
    const bearing = createSnapshot("bearing");
    expect(bearing.health.score).toBeLessThan(healthy.health.score);
    expect(bearing.sensors.vibration.value).toBeGreaterThan(healthy.sensors.vibration.value);
    expect(bearing.anomaly.probableCondition).toMatch(/bearing/i);
    expect(bearing.maintenance).not.toBeNull();
  });

  it("labels sensor drift as a suspect-data condition rather than a mechanical measurement", () => {
    const drift = createSnapshot("sensorDrift");
    expect(drift.sensors.flow.quality).toBe("suspect");
    expect(drift.dataStatus.quality).toBe("suspect");
    expect(drift.anomaly.probableCondition).toMatch(/sensor/i);
  });

  it("returns a bounded chronological trend for a selected scenario", () => {
    const trend = createTrend("valveRestriction", 360);
    expect(trend).toHaveLength(36);
    expect(trend[0]!.timestamp).toBeLessThan(trend[35]!.timestamp);
    expect(trend.every(point => point.healthScore >= 0 && point.healthScore <= 100)).toBe(true);
  });

  it("assesses configured operating-envelope guardrails without presenting them as physical equipment limits", () => {
    const normal = createSnapshot("normal");
    const cavitationLike = createSnapshot("cavitationLike");
    expect(normal.operatingEnvelope.status).toBe("preferred");
    expect(cavitationLike.operatingEnvelope.checks.find(check => check.key === "npsh")?.status).toBe("caution");
    expect(normal.operatingEnvelope.notice).toMatch(/not manufacturer limits/i);
  });

  it("compares a synthetic condition against the same bounded baseline inputs", () => {
    const comparison = createScenarioComparison("bearing", { rpm: 2200, staticHeadM: 3 });
    expect(comparison.baseline.scenario).toBe("normal");
    expect(comparison.candidate.scenario).toBe("bearing");
    expect(comparison.deltas.find(delta => delta.key === "health")?.change).toBeLessThan(0);
    expect(comparison.scopeNotice).toMatch(/does not validate a field fault/i);
  });
});
