import { describe, expect, it } from "vitest";
import { summarizeTelemetryQuality } from "./telemetryQuality";

describe("SmartPump-X telemetry-quality summary", () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);

  it("reports unavailable when no accepted telemetry is stored", () => {
    const summary = summarizeTelemetryQuality([], now);
    expect(summary.status).toBe("unavailable");
    expect(summary.acceptedSamples).toBe(0);
    expect(summary.notice).toMatch(/rejected bridge payloads/i);
  });

  it("summarizes nominal recent accepted measurements by metric", () => {
    const summary = summarizeTelemetryQuality([
      { metric: "flow", value: "42.1", unit: "L/min", quality: "good", capturedAt: now - 2 * 60_000 },
      { metric: "temperature", value: "34.2", unit: "°C", quality: "good", capturedAt: now - 4 * 60_000 },
      { metric: "flow", value: "41.8", unit: "L/min", quality: "good", capturedAt: now - 8 * 60_000 },
    ], now);
    expect(summary.status).toBe("nominal");
    expect(summary.metrics.find(metric => metric.metric === "flow")?.latestValue).toBe(42.1);
    expect(summary.qualityBreakdown.find(item => item.quality === "good")?.count).toBe(3);
  });

  it("flags stale or suspect accepted telemetry for attention", () => {
    const summary = summarizeTelemetryQuality([{ metric: "flow", value: 42, unit: "L/min", quality: "suspect", capturedAt: now - 20 * 60_000 }], now);
    expect(summary.status).toBe("attention");
    expect(summary.ageMinutes).toBe(20);
  });
});
