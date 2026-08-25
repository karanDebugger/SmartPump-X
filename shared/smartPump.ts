export const scenarioKinds = [
  "normal",
  "bearing",
  "impellerBlockage",
  "valveRestriction",
  "cavitationLike",
  "motorOverheat",
  "sensorDrift",
  "reducedFlow",
] as const;

export type ScenarioKind = (typeof scenarioKinds)[number];

export type DataOrigin = "measured" | "calculated" | "estimated" | "synthetic";
export type DataQuality = "good" | "degraded" | "suspect" | "missing";
export type HealthBand = "healthy" | "watch" | "warning" | "critical" | "severe";

export type SensorValue = {
  value: number;
  unit: string;
  origin: DataOrigin;
  quality: DataQuality;
};

export type FaultEvidence = {
  parameter: string;
  observation: string;
  contribution: "primary" | "supporting";
};

export type TwinSnapshot = {
  asset: {
    tag: string;
    name: string;
    service: string;
    operatingState: "running" | "warning" | "critical";
  };
  scenario: ScenarioKind;
  scenarioLabel: string;
  dataStatus: {
    origin: DataOrigin;
    quality: DataQuality;
    notice: string;
  };
  health: {
    score: number;
    band: HealthBand;
    confidence: number;
  };
  sensors: {
    flow: SensorValue;
    suctionPressure: SensorValue;
    dischargePressure: SensorValue;
    differentialPressure: SensorValue;
    temperature: SensorValue;
    vibration: SensorValue;
    rpm: SensorValue;
    voltage: SensorValue;
    current: SensorValue;
    realPower: SensorValue;
  };
  calculations: {
    headM: number;
    hydraulicPowerW: number;
    electricalInputW: number;
    wireToWaterEfficiencyPct: number;
    expectedFlowLpm: number;
    flowResidualPct: number;
    npshMarginM: number;
  };
  anomaly: {
    score: number;
    probableCondition: string;
    severity: "none" | "low" | "medium" | "high" | "critical";
    evidence: FaultEvidence[];
  };
  maintenance: {
    asset: string;
    condition: string;
    action: string;
    inspectionWindow: string;
  } | null;
};

export type TrendPoint = {
  timestamp: number;
  flowLpm: number;
  pressureBar: number;
  temperatureC: number;
  vibrationMmS: number;
  healthScore: number;
  realPowerW: number;
};
