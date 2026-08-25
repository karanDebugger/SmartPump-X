import { describe, expect, it } from "vitest";
import { operationsRouter } from "./routers/operations";
import { buildFaultTestReport } from "./reportBuilder";
import { validateBridgeTelemetry } from "./telemetryValidation";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "admin" | "engineer" | "viewer" | "user"): TrpcContext {
  return { user: { id: 1, openId: `operations-${role}`, name: "Operator", email: "operator@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

function anonymousContext(): TrpcContext {
  return { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("SmartPump-X operational contracts", () => {
  it("keeps operational reads and control actions unavailable to anonymous guests", async () => {
    const caller = operationsRouter.createCaller(anonymousContext());
    await expect(caller.mqttContract()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.commissioning()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.readiness()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.telemetryQuality()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.requestFaultTest({ assetTag: "P-101", scenario: "bearing", objective: "Attempt an unauthorized controlled test request.", riskLevel: "low", scheduledAt: Date.now() + 60_000 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects control-shaped fields on the one-way telemetry bridge", () => {
    const result = validateBridgeTelemetry({ bridgeToken: "x".repeat(32), assetTag: "P-101", sensorKey: "FT-101", metric: "flow", value: 42, unit: "L/min", capturedAt: Date.now(), calibrationRevision: "CAL-01", payloadKeys: ["value", "start"] });
    expect(result).toMatchObject({ valid: false });
  });

  it("exposes the MQTT bridge contract to authenticated operators", async () => {
    const caller = operationsRouter.createCaller(contextFor("viewer"));
    const contract = await caller.mqttContract();
    expect(contract.topic).toContain("telemetry");
    expect(contract.excludedFields).toContain("actuator");
  });

  it("prevents viewers from activating a calibration record", async () => {
    const caller = operationsRouter.createCaller(contextFor("viewer"));
    await expect(caller.createCalibration({ assetTag: "P-101", sensorKey: "FT-101", metric: "flow", unit: "L/min", rangeMin: 0, rangeMax: 80, revision: "CAL-01", validUntil: Date.now() + 86_400_000 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("prevents administrators from creating a calibration that is already expired", async () => {
    const caller = operationsRouter.createCaller(contextFor("admin"));
    await expect(caller.createCalibration({ assetTag: "P-101", sensorKey: "FT-101", metric: "flow", unit: "L/min", rangeMin: 0, rangeMax: 80, revision: "CAL-EXPIRED", validUntil: Date.now() - 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("builds an exportable report that explicitly records the no-actuation boundary", () => {
    const markdown = buildFaultTestReport({ id: 7, assetTag: "P-101", scenario: "bearing", status: "approved", riskLevel: "medium", scheduledAt: Date.UTC(2025, 0, 1), objective: "Record a controlled signature.", approvalNote: "Approved after risk review." }, [{ eventType: "approved", createdAt: new Date("2025-01-01T00:00:00.000Z") }]);
    expect(markdown).toContain("Hardware actuation | Prohibited");
    expect(markdown).toContain("**approved**");
  });
});
