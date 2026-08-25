export type ReadinessStatus = "ready" | "attention" | "blocked";

type CalibrationRecord = {
  status: "draft" | "active" | "expired" | "retired";
  validUntil: number;
};

type CommissioningRecord = {
  completed: number;
  total: number;
};

type FaultTestRecord = {
  status: "requested" | "approved" | "rejected" | "executed" | "closed";
  riskLevel: "low" | "medium" | "high";
};

export type OperationalReadiness = {
  status: ReadinessStatus;
  score: number;
  source: "database" | "planning_baseline";
  summary: string;
  items: Array<{
    key: "commissioning" | "calibration" | "governance" | "interface";
    label: string;
    status: ReadinessStatus;
    detail: string;
  }>;
  notice: string;
};

const statusScore: Record<ReadinessStatus, number> = { ready: 100, attention: 60, blocked: 0 };

function worstStatus(statuses: ReadinessStatus[]): ReadinessStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

export function evaluateOperationalReadiness(input: { calibrations: CalibrationRecord[]; commissioning: CommissioningRecord; faultTests: FaultTestRecord[]; now?: number }): OperationalReadiness {
  const now = input.now ?? Date.now();
  const expiryWarningAt = now + 30 * 24 * 60 * 60_000;
  const activeCalibrations = input.calibrations.filter(calibration => calibration.status === "active" && calibration.validUntil > now);
  const expiredCalibrations = input.calibrations.filter(calibration => calibration.status === "active" && calibration.validUntil <= now);
  const expiringCalibrations = activeCalibrations.filter(calibration => calibration.validUntil <= expiryWarningAt);
  const commissioningStatus: ReadinessStatus = input.commissioning.total === 0 ? "blocked" : input.commissioning.completed === input.commissioning.total ? "ready" : "attention";
  const calibrationStatus: ReadinessStatus = activeCalibrations.length === 0 ? "blocked" : expiringCalibrations.length > 0 ? "attention" : "ready";
  const highRiskInFlight = input.faultTests.some(test => test.riskLevel === "high" && ["requested", "approved", "executed"].includes(test.status));
  const governanceStatus: ReadinessStatus = highRiskInFlight ? "attention" : "ready";
  const interfaceStatus: ReadinessStatus = "ready";
  const items: OperationalReadiness["items"] = [
    { key: "commissioning", label: "Commissioning evidence", status: commissioningStatus, detail: input.commissioning.total === 0 ? "No persisted commissioning checklist is available; physical test readiness is blocked." : `${input.commissioning.completed}/${input.commissioning.total} persisted commissioning checks are verified.` },
    { key: "calibration", label: "Measurement calibration", status: calibrationStatus, detail: activeCalibrations.length === 0 ? "No currently valid active calibration is available for telemetry acceptance." : expiringCalibrations.length > 0 ? `${expiringCalibrations.length} active calibration record(s) expire within 30 days.` : `${activeCalibrations.length} active calibration record(s) are currently valid.${expiredCalibrations.length ? ` ${expiredCalibrations.length} expired record(s) are excluded.` : ""}` },
    { key: "governance", label: "Controlled-test governance", status: governanceStatus, detail: highRiskInFlight ? "A high-risk controlled test remains open in the governance workflow." : "No high-risk controlled test is currently open." },
    { key: "interface", label: "Telemetry interface boundary", status: interfaceStatus, detail: "The bridge is ingestion-only: control-shaped payloads are rejected and no actuator endpoint is present." },
  ];
  const status = worstStatus(items.map(item => item.status));
  const score = Math.round(items.reduce((sum, item) => sum + statusScore[item.status], 0) / items.length);
  const source = input.commissioning.total || input.calibrations.length || input.faultTests.length ? "database" : "planning_baseline";
  return {
    status,
    score,
    source,
    summary: status === "ready" ? "The recorded governance gates are ready for an engineering review. Physical test authorization remains a separate controlled decision." : status === "attention" ? "At least one governance gate needs review before relying on incoming measurements or scheduling further controlled work." : "One or more required governance gates are incomplete or unavailable; do not treat this demonstrator as physically test-ready.",
    items,
    notice: "This is a software readiness summary based on recorded project data. It is not a permit-to-work, safety authorization, or a substitute for a site-specific risk assessment.",
  };
}
