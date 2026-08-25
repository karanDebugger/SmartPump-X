import { and, desc, eq, gte, lte } from "drizzle-orm";
import { bomItems, commissioningChecks, faultTestEvents, faultTestRequests, pumpAssets, sensorCalibrations, telemetry } from "../drizzle/schema";
import { getDb } from "./db";

export async function setCalibration(input: { assetTag: string; sensorKey: string; metric: string; unit: string; rangeMin: number; rangeMax: number; revision: string; validUntil: number; approvedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(sensorCalibrations).values({
    assetTag: input.assetTag,
    sensorKey: input.sensorKey,
    metric: input.metric,
    unit: input.unit,
    rangeMin: input.rangeMin.toString(),
    rangeMax: input.rangeMax.toString(),
    revision: input.revision,
    validUntil: input.validUntil,
    approvedBy: input.approvedBy,
    status: "active",
  });
  return { saved: true as const };
}

export async function findActiveCalibration(assetTag: string, sensorKey: string, revision: string) {
  const db = await getDb();
  if (!db) return undefined;
  const records = await db.select().from(sensorCalibrations).where(and(eq(sensorCalibrations.assetTag, assetTag), eq(sensorCalibrations.sensorKey, sensorKey), eq(sensorCalibrations.revision, revision), eq(sensorCalibrations.status, "active"))).limit(1);
  return records[0];
}

export async function listCalibrations(assetTag?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(sensorCalibrations);
  return assetTag ? query.where(eq(sensorCalibrations.assetTag, assetTag)).orderBy(desc(sensorCalibrations.createdAt)).limit(50) : query.orderBy(desc(sensorCalibrations.createdAt)).limit(50);
}

export async function ensureAsset(assetTag: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const existing = await db.select().from(pumpAssets).where(eq(pumpAssets.tag, assetTag)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(pumpAssets).values({ tag: assetTag, name: `${assetTag} connected pump asset`, service: "External telemetry integration", lifecycleState: "commissioning" });
  const created = await db.select().from(pumpAssets).where(eq(pumpAssets.tag, assetTag)).limit(1);
  if (!created[0]) throw new Error("Unable to create telemetry asset.");
  return created[0];
}

export async function storeValidatedTelemetry(input: { assetTag: string; sensorKey: string; metric: string; value: number; unit: string; capturedAt: number; calibrationRevision: string; quality: "good" | "degraded" | "suspect" | "missing" }) {
  const calibration = await findActiveCalibration(input.assetTag, input.sensorKey, input.calibrationRevision);
  if (!calibration) return { accepted: false as const, reason: "No active calibration matching the supplied asset, sensor and revision." };
  if (calibration.unit !== input.unit) return { accepted: false as const, reason: "Telemetry unit does not match the active calibration record." };
  const min = Number(calibration.rangeMin);
  const max = Number(calibration.rangeMax);
  if (input.value < min || input.value > max) return { accepted: false as const, reason: "Telemetry value is outside the active calibration range." };
  const asset = await ensureAsset(input.assetTag);
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(telemetry).values({ assetId: asset.id, capturedAt: input.capturedAt, metric: input.metric, value: input.value.toString(), unit: input.unit, origin: "measured", quality: input.quality, calibrationRevision: input.calibrationRevision });
  return { accepted: true as const, assetId: asset.id, calibrationRevision: input.calibrationRevision };
}

export async function createFaultTestRequest(input: { assetTag: string; scenario: string; objective: string; riskLevel: "low" | "medium" | "high"; scheduledAt: number; requestedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const inserted = await db.insert(faultTestRequests).values({ ...input, status: "requested", noActuation: 1 });
  const requestId = Number(inserted[0].insertId);
  await db.insert(faultTestEvents).values({ requestId, eventType: "requested", actorId: input.requestedBy, payload: { objective: input.objective, riskLevel: input.riskLevel, noActuation: true } });
  return { requestId, status: "requested" as const };
}

export async function decideFaultTest(input: { requestId: number; approved: boolean; note: string; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const status = input.approved ? "approved" : "rejected";
  await db.update(faultTestRequests).set({ status, approvedBy: input.actorId, approvalNote: input.note, approvedAt: Date.now() }).where(eq(faultTestRequests.id, input.requestId));
  await db.insert(faultTestEvents).values({ requestId: input.requestId, eventType: status, actorId: input.actorId, payload: { note: input.note, noActuation: true } });
  return { requestId: input.requestId, status };
}

export async function recordFaultTestExecution(input: { requestId: number; evidence: string; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const request = (await db.select().from(faultTestRequests).where(eq(faultTestRequests.id, input.requestId)).limit(1))[0];
  if (!request || request.status !== "approved") throw new Error("Only approved fault-test requests can receive an execution record.");
  await db.update(faultTestRequests).set({ status: "executed" }).where(eq(faultTestRequests.id, input.requestId));
  await db.insert(faultTestEvents).values({ requestId: input.requestId, eventType: "execution_recorded", actorId: input.actorId, payload: { evidence: input.evidence, noActuation: true } });
  return { requestId: input.requestId, status: "executed" as const };
}

export async function closeFaultTest(input: { requestId: number; closureNote: string; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const request = (await db.select().from(faultTestRequests).where(eq(faultTestRequests.id, input.requestId)).limit(1))[0];
  if (!request || !["approved", "executed"].includes(request.status)) throw new Error("Only approved or executed fault-test requests can be closed.");
  await db.update(faultTestRequests).set({ status: "closed" }).where(eq(faultTestRequests.id, input.requestId));
  await db.insert(faultTestEvents).values({ requestId: input.requestId, eventType: "closed", actorId: input.actorId, payload: { closureNote: input.closureNote, noActuation: true } });
  return { requestId: input.requestId, status: "closed" as const };
}

export async function listFaultTestHistory(filters: { assetTag?: string; scenario?: string; status?: "requested" | "approved" | "rejected" | "executed" | "closed"; from?: number; to?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    filters.assetTag ? eq(faultTestRequests.assetTag, filters.assetTag) : undefined,
    filters.scenario ? eq(faultTestRequests.scenario, filters.scenario) : undefined,
    filters.status ? eq(faultTestRequests.status, filters.status) : undefined,
    filters.from ? gte(faultTestRequests.scheduledAt, filters.from) : undefined,
    filters.to ? lte(faultTestRequests.scheduledAt, filters.to) : undefined,
  ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
  const query = db.select().from(faultTestRequests);
  return conditions.length ? query.where(and(...conditions)).orderBy(desc(faultTestRequests.createdAt)).limit(50) : query.orderBy(desc(faultTestRequests.createdAt)).limit(50);
}

export async function getFaultTestReport(requestId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const request = (await db.select().from(faultTestRequests).where(eq(faultTestRequests.id, requestId)).limit(1))[0];
  if (!request) return undefined;
  const events = await db.select().from(faultTestEvents).where(eq(faultTestEvents.requestId, requestId)).orderBy(faultTestEvents.createdAt);
  return { request, events };
}

export async function getCommissioningSummary() {
  const db = await getDb();
  if (!db) return { completed: 0, total: 0, checks: [] };
  const checks = await db.select().from(commissioningChecks).orderBy(commissioningChecks.groupName, commissioningChecks.sortOrder);
  return { completed: checks.filter(check => check.status === "verified").length, total: checks.length, checks };
}

export async function listBom() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bomItems).orderBy(bomItems.assembly, bomItems.component);
}
