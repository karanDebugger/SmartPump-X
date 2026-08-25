import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { faultTestEvents, faultTestRequests } from "../drizzle/schema";
import { getDb } from "./db";
import { operationsRouter } from "./routers/operations";
import type { TrpcContext } from "./_core/context";

const createdRequestIds: number[] = [];
const adminContext = { user: { id: 1, openId: "workflow-admin", name: "Workflow Admin", email: "workflow@example.com", loginMethod: "test", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;

afterEach(async () => {
  const db = await getDb();
  if (!db) return;
  for (const requestId of createdRequestIds.splice(0)) {
    await db.delete(faultTestEvents).where(eq(faultTestEvents.requestId, requestId));
    await db.delete(faultTestRequests).where(eq(faultTestRequests.id, requestId));
  }
});

describe("persisted controlled fault-test workflow", () => {
  it("records request, approval, execution, closure, filtered history and exportable report", async () => {
    const caller = operationsRouter.createCaller(adminContext);
    const requested = await caller.requestFaultTest({ assetTag: "P-101", scenario: "bearing", objective: "Validate persisted request, approval, execution and closure transitions.", riskLevel: "low", scheduledAt: Date.now() + 60_000 });
    createdRequestIds.push(requested.requestId);
    expect(requested.status).toBe("requested");
    expect(await caller.decideFaultTest({ requestId: requested.requestId, approved: true, note: "Approved under the no-actuation test procedure." })).toMatchObject({ status: "approved" });
    expect(await caller.recordFaultTestExecution({ requestId: requested.requestId, evidence: "Evidence captured against the approved procedure; no software actuation occurred." })).toMatchObject({ status: "executed" });
    expect(await caller.closeFaultTest({ requestId: requested.requestId, closureNote: "Evidence reviewed and retained; controlled record closed." })).toMatchObject({ status: "closed" });
    const history = await caller.faultTestHistory({ assetTag: "P-101", scenario: "bearing", status: "closed" });
    expect(history.some(item => item.id === requested.requestId)).toBe(true);
    const report = await caller.faultTestReport({ requestId: requested.requestId });
    expect(report.markdown).toContain("**execution_recorded**");
    expect(report.markdown).toContain("**closed**");
  });
});
