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

export type SimulationInputs = {
  rpm: number;
  staticHeadM: number;
  resistanceMultiplier: number;
  inletTemperatureC: number;
};

export const simulationInputDefaults: SimulationInputs = {
  rpm: 2850,
  staticHeadM: 1.8,
  resistanceMultiplier: 1,
  inletTemperatureC: 25,
};

export const simulationInputBounds = {
  rpm: { min: 1800, max: 3300, step: 50, label: "Drive speed", unit: "rpm" },
  staticHeadM: { min: 0.5, max: 12, step: 0.1, label: "Static head", unit: "m" },
  resistanceMultiplier: { min: 0.35, max: 6, step: 0.05, label: "System resistance", unit: "× nominal" },
  inletTemperatureC: { min: 10, max: 40, step: 1, label: "Inlet temperature", unit: "°C" },
} as const;

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

export type OperatingEnvelopeCheck = {
  key: "flow" | "temperature" | "vibration" | "npsh" | "efficiency";
  label: string;
  value: number;
  unit: string;
  status: "preferred" | "caution" | "outside";
  guidance: string;
};

export type OperatingEnvelope = {
  status: "preferred" | "caution" | "outside";
  summary: string;
  notice: string;
  checks: OperatingEnvelopeCheck[];
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
  operatingEnvelope: OperatingEnvelope;
};

export type ScenarioComparison = {
  baseline: TwinSnapshot;
  candidate: TwinSnapshot;
  deltas: Array<{
    key: "flow" | "head" | "inputPower" | "efficiency" | "npshMargin" | "health";
    label: string;
    unit: string;
    baseline: number;
    candidate: number;
    change: number;
  }>;
  summary: string;
  scopeNotice: string;
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
