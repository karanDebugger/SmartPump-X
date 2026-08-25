import type { TelemetryQualitySummary } from "../shared/operations";

type TelemetryQualityRecord = {
  metric: string;
  value: number | string;
  unit: string;
  quality: "good" | "degraded" | "suspect" | "missing";
  capturedAt: number;
};

const qualities: TelemetryQualitySummary["qualityBreakdown"][number]["quality"][] = ["good", "degraded", "suspect", "missing"];

export function summarizeTelemetryQuality(records: TelemetryQualityRecord[], now = Date.now()): TelemetryQualitySummary {
  const ordered = [...records].sort((left, right) => right.capturedAt - left.capturedAt);
  const latestCapturedAt = ordered[0]?.capturedAt ?? null;
  const ageMinutes = latestCapturedAt === null ? null : Math.max(0, Math.round((now - latestCapturedAt) / 60_000));
  const qualityBreakdown = qualities.map(quality => ({ quality, count: ordered.filter(record => record.quality === quality).length }));
  const metrics = Array.from(new Set(ordered.map(record => record.metric))).map(metric => {
    const metricRecords = ordered.filter(record => record.metric === metric);
    const latest = metricRecords[0]!;
    return { metric, unit: latest.unit, latestValue: Number(latest.value), capturedAt: latest.capturedAt, quality: latest.quality, samples: metricRecords.length };
  });
  const hasSuspectQuality = qualityBreakdown.some(item => item.quality !== "good" && item.count > 0);
  const stale = ageMinutes !== null && ageMinutes > 15;
  const status = ordered.length === 0 ? "unavailable" as const : hasSuspectQuality || stale ? "attention" as const : "nominal" as const;
  return {
    source: ordered.length ? "database" : "no_accepted_telemetry",
    status,
    acceptedSamples: ordered.length,
    latestCapturedAt,
    ageMinutes,
    qualityBreakdown,
    metrics,
    rejectionGuards: ["Bridge token is required", "Control-shaped payload fields are rejected", "Active, unexpired calibration revision is required", "Unit and calibrated range must match", "Captured timestamp must be within the allowed window"],
    summary: status === "nominal" ? `${ordered.length} accepted measurement sample(s) are available and the newest is within the 15-minute demonstration freshness window.` : status === "attention" ? "Accepted telemetry is present, but either its reported quality or its freshness needs engineering review." : "No accepted measurement telemetry is available for this asset. The public control tower remains synthetic until a calibrated bridge is connected.",
    notice: "This panel summarizes accepted telemetry only. Rejected bridge payloads are deliberately not persisted as telemetry; investigate bridge logs for token, schema, calibration, unit, range, timestamp, or control-shaped-field rejections.",
  };
}
