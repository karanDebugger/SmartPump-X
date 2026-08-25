import type { Request, Response } from "express";
import { z } from "zod";
import { storeValidatedTelemetry } from "./operations";
import { isTelemetryBridgeAuthorized } from "./telemetryAuth";
import { validateBridgeTelemetry } from "./telemetryValidation";

const payloadSchema = z.object({
  assetTag: z.string().min(2).max(32),
  sensorKey: z.string().min(2).max(64),
  metric: z.string().min(2).max(64),
  value: z.number().finite(),
  unit: z.string().min(1).max(32),
  capturedAt: z.number().int(),
  calibrationRevision: z.string().min(1).max(32),
  quality: z.enum(["good", "degraded", "suspect", "missing"]).optional(),
}).strict();

export async function handleTelemetryIngest(req: Request, res: Response) {
  const bridgeToken = req.header("x-smartpump-telemetry-token");
  if (!isTelemetryBridgeAuthorized(bridgeToken)) return res.status(401).json({ accepted: false, code: "UNAUTHORIZED", actuation: false });
  const parsed = payloadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ accepted: false, code: "INVALID_PAYLOAD", actuation: false });
  const validated = validateBridgeTelemetry({ bridgeToken: bridgeToken!, ...parsed.data, payloadKeys: Object.keys(req.body) });
  if (!validated.valid) return res.status(400).json({ accepted: false, code: "REJECTED_PAYLOAD", reason: validated.reason, actuation: false });
  try {
    const stored = await storeValidatedTelemetry({ ...parsed.data, quality: parsed.data.quality ?? "good" });
    if (!stored.accepted) return res.status(412).json({ ...stored, code: "CALIBRATION_GATE", actuation: false });
    return res.status(202).json({ ...stored, mode: "ingestion_only", actuation: false });
  } catch {
    return res.status(503).json({ accepted: false, code: "INGESTION_UNAVAILABLE", actuation: false });
  }
}
