import { describe, expect, it } from "vitest";
import { evaluateOperationalReadiness } from "./operationalReadiness";

describe("SmartPump-X operational readiness", () => {
  const now = Date.UTC(2026, 0, 1);

  it("blocks physical-readiness claims when commissioning evidence and valid calibration are absent", () => {
    const readiness = evaluateOperationalReadiness({ calibrations: [], commissioning: { completed: 0, total: 0 }, faultTests: [], now });
    expect(readiness.status).toBe("blocked");
    expect(readiness.items.find(item => item.key === "commissioning")?.status).toBe("blocked");
    expect(readiness.items.find(item => item.key === "calibration")?.detail).toMatch(/no currently valid active calibration/i);
  });

  it("marks expiring calibrations and open high-risk tests for attention", () => {
    const readiness = evaluateOperationalReadiness({
      calibrations: [{ status: "active", validUntil: now + 10 * 24 * 60 * 60_000 }],
      commissioning: { completed: 4, total: 4 },
      faultTests: [{ status: "approved", riskLevel: "high" }],
      now,
    });
    expect(readiness.status).toBe("attention");
    expect(readiness.items.find(item => item.key === "calibration")?.status).toBe("attention");
    expect(readiness.items.find(item => item.key === "governance")?.status).toBe("attention");
  });

  it("reports ready only when all recorded governance gates are satisfactory", () => {
    const readiness = evaluateOperationalReadiness({
      calibrations: [{ status: "active", validUntil: now + 90 * 24 * 60 * 60_000 }],
      commissioning: { completed: 3, total: 3 },
      faultTests: [{ status: "closed", riskLevel: "high" }],
      now,
    });
    expect(readiness.status).toBe("ready");
    expect(readiness.score).toBe(100);
    expect(readiness.notice).toMatch(/not a permit-to-work/i);
  });
});
