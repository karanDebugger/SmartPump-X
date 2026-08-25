import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { scenarioKinds } from "../../shared/smartPump";
import { DEMO_DATASET_VERSION, createDeterministicDemoTrend } from "../demoDataset";
import { createSimulationPreviewAudit } from "../db";
import { createSnapshot, scenarioDetails } from "../pumpEngine";
import { isTelemetryBridgeAuthorized } from "../telemetryAuth";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const scenarioSchema = z.enum(scenarioKinds);

const engineerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || !["admin", "engineer"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Engineer or administrator access is required for controlled simulation runs." });
  }
  return next();
});

export const pumpRouter = router({
  bridgeHealth: publicProcedure
    .input(z.object({ bridgeToken: z.string().min(24).max(512) }))
    .query(({ input }) => {
      if (!isTelemetryBridgeAuthorized(input.bridgeToken)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Telemetry bridge authentication failed." });
      }
      return { authorized: true as const, mode: "ingestion_only" as const, actuation: false as const };
    }),
  scenarios: protectedProcedure.query(() =>
    scenarioKinds.map(key => ({
      key,
      label: scenarioDetails(key).label,
      severity: scenarioDetails(key).severity,
      description: scenarioDetails(key).likelyCondition,
    })),
  ),
  snapshot: protectedProcedure
    .input(z.object({ scenario: scenarioSchema }))
    .query(({ input }) => createSnapshot(input.scenario)),
  trend: protectedProcedure
    .input(z.object({ scenario: scenarioSchema, windowMinutes: z.number().int().min(60).max(1_440) }))
    .query(({ input }) => createDeterministicDemoTrend(input.scenario, input.windowMinutes)),
  engineeringPreview: protectedProcedure
    .input(z.object({ scenario: scenarioSchema }))
    .query(({ input }) => {
      const snapshot = createSnapshot(input.scenario);
      return {
        formula: "P_h = ρgQH; η_wire-to-water = P_h / P_electrical",
        assumptions: [
          "Water density is fixed at 998 kg/m³ and gravitational acceleration is 9.80665 m/s².",
          "The pump curve and system-resistance relationship are deterministic demonstration assumptions, not a manufacturer curve.",
          "All present dashboard values are synthetic or derived from synthetic values until sensor calibration data are connected.",
        ],
        calculations: snapshot.calculations,
      };
    }),
  maintenance: protectedProcedure
    .input(z.object({ scenario: scenarioSchema }))
    .query(({ input }) => {
      const snapshot = createSnapshot(input.scenario);
      return {
        maintenance: snapshot.maintenance,
        source: snapshot.dataStatus.origin,
        dataQuality: snapshot.dataStatus.quality,
      };
    }),
  recordSimulationRun: engineerProcedure
    .input(z.object({ scenario: scenarioSchema, operatorNote: z.string().trim().min(8).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const requestedAt = Date.now();
      const saved = await createSimulationPreviewAudit({
        userId: ctx.user.id,
        scenario: input.scenario,
        datasetVersion: DEMO_DATASET_VERSION,
        operatorNote: input.operatorNote,
        requestedAt,
      });
      return {
        recorded: saved?.recorded ?? false,
        status: "preview_only" as const,
        message: "The controlled run is evaluated safely as a preview only. This API has no actuator, MQTT publish path, or physical-pump control capability.",
        audit: {
          requestedBy: ctx.user.name ?? ctx.user.email ?? "Authenticated engineer",
          requestedAt,
          scenario: input.scenario,
          operatorNote: input.operatorNote,
        },
        datasetVersion: DEMO_DATASET_VERSION,
      };
    }),
});
