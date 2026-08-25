const blockedKeys = new Set(["command", "setpoint", "start", "stop", "speed", "actuator", "control"]);
const validQualities = new Set(["good", "degraded", "suspect", "missing"]);

export type BridgeTelemetryPayload = {
  bridgeToken: string;
  assetTag: string;
  sensorKey: string;
  metric: string;
  value: number;
  unit: string;
  capturedAt: number;
  calibrationRevision: string;
  quality?: "good" | "degraded" | "suspect" | "missing";
  payloadKeys?: string[];
};

export function validateBridgeTelemetry(input: BridgeTelemetryPayload) {
  const now = Date.now();
  if (input.payloadKeys?.some(key => blockedKeys.has(key.toLowerCase()))) return { valid: false as const, reason: "Control and actuation fields are prohibited on the telemetry bridge." };
  if (!/^[A-Za-z0-9_-]{2,32}$/.test(input.assetTag)) return { valid: false as const, reason: "Asset tag format is invalid." };
  if (!/^[A-Za-z0-9_.-]{2,64}$/.test(input.sensorKey)) return { valid: false as const, reason: "Sensor key format is invalid." };
  if (!/^[A-Za-z0-9_. -]{2,64}$/.test(input.metric)) return { valid: false as const, reason: "Metric format is invalid." };
  if (!Number.isFinite(input.value)) return { valid: false as const, reason: "Telemetry value must be finite." };
  if (!Number.isInteger(input.capturedAt) || input.capturedAt > now + 5 * 60_000 || input.capturedAt < now - 7 * 24 * 60 * 60_000) return { valid: false as const, reason: "Timestamp falls outside the accepted seven-day telemetry window." };
  if (input.quality && !validQualities.has(input.quality)) return { valid: false as const, reason: "Telemetry quality is invalid." };
  return { valid: true as const };
}
