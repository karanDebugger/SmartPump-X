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

describe("pump router contracts", () => {
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
