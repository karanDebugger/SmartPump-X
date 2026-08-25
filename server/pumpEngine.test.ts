import { describe, expect, it } from "vitest";
import { createSnapshot, createTrend } from "./pumpEngine";

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
});
