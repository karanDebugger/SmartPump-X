import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { commissioningChecklist, mqttBridgeContract, starterBom } from "../../shared/operations";
import { closeFaultTest, createFaultTestRequest, decideFaultTest, getCommissioningSummary, getFaultTestReport, getTelemetryQualitySummary, listBom, listCalibrations, listFaultTestHistory, recordFaultTestExecution, setCalibration, storeValidatedTelemetry } from "../operations";
import { isTelemetryBridgeAuthorized } from "../telemetryAuth";
import { validateBridgeTelemetry } from "../telemetryValidation";
import { buildFaultTestReport } from "../reportBuilder";
import { evaluateOperationalReadiness } from "../operationalReadiness";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator approval is required." });
  return next();
});

const engineerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || !["admin", "engineer"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Engineer or administrator access is required." });
  return next();
});

const bridgePayloadSchema = z.object({
  bridgeToken: z.string().min(24).max(512),
  assetTag: z.string().min(2).max(32),
  sensorKey: z.string().min(2).max(64),
  metric: z.string().min(2).max(64),
  value: z.number().finite(),
  unit: z.string().min(1).max(32),
  capturedAt: z.number().int(),
  calibrationRevision: z.string().min(1).max(32),
  quality: z.enum(["good", "degraded", "suspect", "missing"]).optional(),
  payloadKeys: z.array(z.string().max(64)).max(20).optional(),
});

export const operationsRouter = router({
  mqttContract: protectedProcedure.query(() => mqttBridgeContract),
  ingestTelemetry: publicProcedure.input(bridgePayloadSchema).mutation(async ({ input }) => {
    if (!isTelemetryBridgeAuthorized(input.bridgeToken)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Telemetry bridge authentication failed." });
    const validated = validateBridgeTelemetry(input);
    if (!validated.valid) throw new TRPCError({ code: "BAD_REQUEST", message: validated.reason });
    const stored = await storeValidatedTelemetry({ ...input, quality: input.quality ?? "good" });
    if (!stored.accepted) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stored.reason });
    return { ...stored, mode: "ingestion_only" as const, actuation: false as const };
  }),
  createCalibration: adminProcedure.input(z.object({ assetTag: z.string().min(2).max(32), sensorKey: z.string().min(2).max(64), metric: z.string().min(2).max(64), unit: z.string().min(1).max(32), rangeMin: z.number().finite(), rangeMax: z.number().finite(), revision: z.string().min(1).max(32), validUntil: z.number().int() })).mutation(async ({ ctx, input }) => {
    if (input.rangeMin >= input.rangeMax) throw new TRPCError({ code: "BAD_REQUEST", message: "Calibration minimum must be lower than calibration maximum." });
    if (input.validUntil <= Date.now()) throw new TRPCError({ code: "BAD_REQUEST", message: "Calibration validity must end in the future." });
    return setCalibration({ ...input, approvedBy: ctx.user.id });
  }),
  calibrations: protectedProcedure.input(z.object({ assetTag: z.string().min(2).max(32).optional() }).optional()).query(({ input }) => listCalibrations(input?.assetTag)),
  bom: protectedProcedure.query(async () => {
    const items = await listBom();
    return { source: items.length ? "database" as const : "planning_baseline" as const, items: items.length ? items : starterBom };
  }),
  commissioning: protectedProcedure.query(async () => {
    const summary = await getCommissioningSummary();
    return summary.total ? { source: "database" as const, ...summary } : {
      source: "planning_baseline" as const,
      completed: 0,
      total: commissioningChecklist.length,
      checks: commissioningChecklist.map((check, index) => ({
        checkKey: check.key,
        groupName: check.group,
        title: check.title,
        evidenceRequirement: check.evidence,
        sortOrder: index,
        status: "not_started" as const,
      })),
    };
  }),
  readiness: protectedProcedure.query(async () => {
    const [calibrations, commissioning, faultTests] = await Promise.all([listCalibrations("P-101"), getCommissioningSummary(), listFaultTestHistory({ assetTag: "P-101" })]);
    return evaluateOperationalReadiness({ calibrations, commissioning, faultTests });
  }),
  telemetryQuality: protectedProcedure.query(() => getTelemetryQualitySummary("P-101")),
  requestFaultTest: engineerProcedure.input(z.object({ assetTag: z.string().min(2).max(32), scenario: z.string().min(2).max(64), objective: z.string().min(12).max(500), riskLevel: z.enum(["low", "medium", "high"]), scheduledAt: z.number().int() })).mutation(({ ctx, input }) => createFaultTestRequest({ ...input, requestedBy: ctx.user.id })),
  decideFaultTest: adminProcedure.input(z.object({ requestId: z.number().int().positive(), approved: z.boolean(), note: z.string().min(8).max(500) })).mutation(({ ctx, input }) => decideFaultTest({ ...input, actorId: ctx.user.id })),
  recordFaultTestExecution: engineerProcedure.input(z.object({ requestId: z.number().int().positive(), evidence: z.string().min(12).max(500) })).mutation(async ({ ctx, input }) => {
    try { return await recordFaultTestExecution({ ...input, actorId: ctx.user.id }); }
    catch (error) { throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Unable to record the controlled test." }); }
  }),
  closeFaultTest: engineerProcedure.input(z.object({ requestId: z.number().int().positive(), closureNote: z.string().min(12).max(500) })).mutation(async ({ ctx, input }) => {
    try { return await closeFaultTest({ ...input, actorId: ctx.user.id }); }
    catch (error) { throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Unable to close the controlled test." }); }
  }),
  faultTestHistory: protectedProcedure.input(z.object({ assetTag: z.string().min(2).max(32).optional(), scenario: z.string().min(2).max(64).optional(), status: z.enum(["requested", "approved", "rejected", "executed", "closed"]).optional(), from: z.number().int().optional(), to: z.number().int().optional() }).optional()).query(({ input }) => listFaultTestHistory(input)),
  faultTestReport: protectedProcedure.input(z.object({ requestId: z.number().int().positive() })).query(async ({ input }) => {
    const record = await getFaultTestReport(input.requestId);
    if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Fault-test record not found." });
    const markdown = buildFaultTestReport(record.request, record.events);
    return { filename: `smartpump-x-fault-test-${record.request.id}.md`, markdown, status: record.request.status };
  }),
});
