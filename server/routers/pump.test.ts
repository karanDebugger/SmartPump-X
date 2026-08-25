import { describe, expect, it } from "vitest";
import { pumpRouter } from "./pump";
import type { TrpcContext } from "../_core/context";

function contextFor(role: "admin" | "engineer" | "viewer" | "user"): TrpcContext {
  return {
    user: { id: 1, openId: `test-${role}`, name: "Test operator", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function anonymousContext(): TrpcContext {
  return { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("pump router contracts", () => {
  it("returns synthetic dashboard data to an anonymous guest", async () => {
    const caller = pumpRouter.createCaller(anonymousContext());
    const [snapshot, trend, scenarios] = await Promise.all([
      caller.snapshot({ scenario: "normal" }),
      caller.trend({ scenario: "normal", windowMinutes: 360 }),
      caller.scenarios(),
    ]);
    expect(snapshot.dataStatus.origin).toBe("synthetic");
    expect(trend).toHaveLength(36);
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it("recalculates a guest dashboard operating point from bounded input overrides", async () => {
    const caller = pumpRouter.createCaller(anonymousContext());
    const baseline = await caller.snapshot({ scenario: "normal" });
    const adjusted = await caller.snapshot({ scenario: "normal", inputs: { rpm: 2200, staticHeadM: 5, resistanceMultiplier: 2.5, inletTemperatureC: 32 } });
    expect(adjusted.sensors.rpm.value).toBe(2200);
    expect(adjusted.calculations.headM).not.toBe(baseline.calculations.headM);
    expect(adjusted.sensors.temperature.value).toBeGreaterThan(baseline.sensors.temperature.value);
  });

  it("returns a public comparison against the normal synthetic baseline using the same guest inputs", async () => {
    const caller = pumpRouter.createCaller(anonymousContext());
    const comparison = await caller.comparison({ scenario: "bearing", inputs: { rpm: 2200, staticHeadM: 3 } });
    expect(comparison.baseline.scenario).toBe("normal");
    expect(comparison.candidate.scenario).toBe("bearing");
    expect(comparison.deltas.find(delta => delta.key === "health")?.change).toBeLessThan(0);
  });

  it("rejects guest simulation input outside the declared physical demonstration bounds", async () => {
    const caller = pumpRouter.createCaller(anonymousContext());
    await expect(caller.snapshot({ scenario: "normal", inputs: { rpm: 4500 } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("keeps controlled simulation mutations protected for an anonymous guest", async () => {
    const caller = pumpRouter.createCaller(anonymousContext());
    await expect(caller.recordSimulationRun({ scenario: "bearing", operatorNote: "Attempting an unauthenticated simulation audit request." })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns authenticated snapshot, trend and maintenance contracts", async () => {
    const caller = pumpRouter.createCaller(contextFor("viewer"));
    const [snapshot, trend, maintenance] = await Promise.all([
      caller.snapshot({ scenario: "bearing" }),
      caller.trend({ scenario: "bearing", windowMinutes: 360 }),
      caller.maintenance({ scenario: "bearing" }),
    ]);
    expect(snapshot.dataStatus.origin).toBe("synthetic");
    expect(trend).toHaveLength(36);
    expect(maintenance.maintenance?.asset).toBe("P-101");
  });

  it("forbids a viewer from requesting a controlled simulation audit preview", async () => {
    const caller = pumpRouter.createCaller(contextFor("viewer"));
    await expect(caller.recordSimulationRun({ scenario: "bearing", operatorNote: "Review the synthetic bearing signature safely." })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permits an engineer to create a preview-only simulation audit record", async () => {
    const caller = pumpRouter.createCaller(contextFor("engineer"));
    const result = await caller.recordSimulationRun({ scenario: "valveRestriction", operatorNote: "Review the discharge-side restriction demonstration." });
    expect(result.recorded).toBe(true);
    expect(result.status).toBe("preview_only");
    expect(result.datasetVersion).toBe("smartpump-x-v1");
  });
});
