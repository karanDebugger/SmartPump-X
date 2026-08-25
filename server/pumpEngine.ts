import type { FaultEvidence, HealthBand, ScenarioKind, TrendPoint, TwinSnapshot } from "../shared/smartPump";

const WATER_DENSITY_KG_M3 = 998;
const GRAVITY_M_S2 = 9.80665;
const NOMINAL_RPM = 2850;
const NOMINAL_VOLTAGE = 24;
const NOMINAL_FLOW_M3_S = 0.0007;

const scenarioConfiguration: Record<ScenarioKind, {
  label: string;
  likelyCondition: string;
  pumpHeadMultiplier: number;
  systemResistanceMultiplier: number;
  efficiencyPenalty: number;
  vibrationBase: number;
  temperatureDelta: number;
  currentDelta: number;
  flowMeasurementBias: number;
  quality: "good" | "degraded" | "suspect";
  npshPenalty: number;
  severity: "none" | "low" | "medium" | "high" | "critical";
  evidence: FaultEvidence[];
  maintenance: TwinSnapshot["maintenance"];
}> = {
  normal: {
    label: "Normal operation",
    likelyCondition: "No active condition detected",
    pumpHeadMultiplier: 1,
    systemResistanceMultiplier: 1,
    efficiencyPenalty: 0,
    vibrationBase: 0.78,
    temperatureDelta: 0,
    currentDelta: 0,
    flowMeasurementBias: 0,
    quality: "good",
    npshPenalty: 0,
    severity: "none",
    evidence: [{ parameter: "Operating envelope", observation: "Flow, head, temperature and vibration remain within the synthetic baseline.", contribution: "primary" }],
    maintenance: null,
  },
  bearing: {
    label: "Bearing degradation signature",
    likelyCondition: "Possible bearing degradation",
    pumpHeadMultiplier: 0.98,
    systemResistanceMultiplier: 1,
    efficiencyPenalty: 0.1,
    vibrationBase: 3.9,
    temperatureDelta: 16,
    currentDelta: 0.42,
    flowMeasurementBias: 0,
    quality: "good",
    npshPenalty: 0,
    severity: "high",
    evidence: [
      { parameter: "Vibration", observation: "Broadband vibration is materially above the synthetic healthy baseline.", contribution: "primary" },
      { parameter: "Motor/pump temperature", observation: "A sustained thermal rise accompanies the vibration change.", contribution: "supporting" },
      { parameter: "Wire-to-water efficiency", observation: "Efficiency residual is negative after accounting for the operating point.", contribution: "supporting" },
    ],
    maintenance: { asset: "P-101", condition: "Early mechanical degradation signature", action: "Inspect bearing condition, coupling alignment and mounting fasteners during the next planned maintenance window.", inspectionWindow: "Within 7 days or before the next duty-cycle increase" },
  },
  impellerBlockage: {
    label: "Impeller blockage / restriction",
    likelyCondition: "Possible impeller or inlet restriction",
    pumpHeadMultiplier: 0.79,
    systemResistanceMultiplier: 1.35,
    efficiencyPenalty: 0.14,
    vibrationBase: 1.75,
    temperatureDelta: 8,
    currentDelta: 0.18,
    flowMeasurementBias: 0,
    quality: "good",
    npshPenalty: 0.18,
    severity: "high",
    evidence: [
      { parameter: "Flow", observation: "Measured model flow falls below the expected operating-point envelope.", contribution: "primary" },
      { parameter: "Hydraulic efficiency", observation: "Hydraulic output declines relative to electrical input.", contribution: "supporting" },
      { parameter: "Differential pressure", observation: "Head development is lower than the healthy curve prediction.", contribution: "supporting" },
    ],
    maintenance: { asset: "P-101", condition: "Hydraulic restriction signature", action: "Inspect strainer, suction line and impeller passages; verify no foreign-object blockage.", inspectionWindow: "At the next safe shutdown" },
  },
  valveRestriction: {
    label: "Discharge valve restriction",
    likelyCondition: "Possible discharge-side restriction",
    pumpHeadMultiplier: 1,
    systemResistanceMultiplier: 3.3,
    efficiencyPenalty: 0.08,
    vibrationBase: 1.25,
    temperatureDelta: 5,
    currentDelta: 0.1,
    flowMeasurementBias: 0,
    quality: "good",
    npshPenalty: 0,
    severity: "medium",
    evidence: [
      { parameter: "Flow", observation: "Flow is reduced while pump differential pressure remains elevated.", contribution: "primary" },
      { parameter: "System curve", observation: "The simulated operating point shifts toward a high-resistance system curve.", contribution: "supporting" },
      { parameter: "Power", observation: "Power and hydraulic efficiency no longer track the normal point.", contribution: "supporting" },
    ],
    maintenance: { asset: "P-101", condition: "Discharge restriction signature", action: "Verify discharge-valve position and inspect downstream restriction points.", inspectionWindow: "Within the current operating shift" },
  },
  cavitationLike: {
    label: "Cavitation-like hydraulic instability",
    likelyCondition: "Cavitation-like instability — requires physical confirmation",
    pumpHeadMultiplier: 0.72,
    systemResistanceMultiplier: 1.08,
    efficiencyPenalty: 0.2,
    vibrationBase: 3.1,
    temperatureDelta: 4,
    currentDelta: 0.08,
    flowMeasurementBias: 0,
    quality: "good",
    npshPenalty: 1.15,
    severity: "high",
    evidence: [
      { parameter: "NPSH margin", observation: "The modelled suction-margin proxy falls below its configured healthy margin.", contribution: "primary" },
      { parameter: "Vibration", observation: "Hydraulic instability is represented as an elevated broadband vibration proxy.", contribution: "supporting" },
      { parameter: "Head residual", observation: "Delivered head falls beneath the healthy pump-curve estimate.", contribution: "supporting" },
    ],
    maintenance: { asset: "P-101", condition: "Cavitation-like signature", action: "Verify suction level, inlet restriction, liquid temperature and suction-line configuration before continuing operation.", inspectionWindow: "Immediate controlled inspection" },
  },
  motorOverheat: {
    label: "Motor overheating",
    likelyCondition: "Possible motor thermal overload",
    pumpHeadMultiplier: 0.98,
    systemResistanceMultiplier: 1,
    efficiencyPenalty: 0.12,
    vibrationBase: 1.05,
    temperatureDelta: 37,
    currentDelta: 0.65,
    flowMeasurementBias: 0,
    quality: "good",
    npshPenalty: 0,
    severity: "critical",
    evidence: [
      { parameter: "Temperature", observation: "Motor/pump temperature exceeds the configured thermal warning envelope.", contribution: "primary" },
      { parameter: "Current", observation: "Current rises relative to the expected power draw at this operating point.", contribution: "supporting" },
      { parameter: "Efficiency", observation: "Electrical input increases without a proportional hydraulic output increase.", contribution: "supporting" },
    ],
    maintenance: { asset: "P-101", condition: "Thermal overload signature", action: "Reduce duty safely and inspect cooling path, supply conditions, mechanical load and motor windings.", inspectionWindow: "Immediate controlled response" },
  },
  sensorDrift: {
    label: "Flow-sensor drift",
    likelyCondition: "Possible flow-sensor calibration drift",
    pumpHeadMultiplier: 1,
    systemResistanceMultiplier: 1,
    efficiencyPenalty: 0,
    vibrationBase: 0.78,
    temperatureDelta: 0,
    currentDelta: 0,
    flowMeasurementBias: 0.17,
    quality: "suspect",
    npshPenalty: 0,
    severity: "medium",
    evidence: [
      { parameter: "Flow residual", observation: "Reported flow diverges from the hydraulic-model estimate while other indicators remain baseline-like.", contribution: "primary" },
      { parameter: "Data quality", observation: "The synthetic scenario flags the affected channel as suspect rather than inferring a mechanical fault.", contribution: "supporting" },
    ],
    maintenance: { asset: "FT-101", condition: "Measurement integrity issue", action: "Verify flow-sensor zero/span and inspect signal wiring before using the value for health scoring.", inspectionWindow: "Before the next assessment cycle" },
  },
  reducedFlow: {
    label: "Reduced-flow condition",
    likelyCondition: "Reduced-flow operating condition",
    pumpHeadMultiplier: 1,
    systemResistanceMultiplier: 5.2,
    efficiencyPenalty: 0.11,
    vibrationBase: 1.35,
    temperatureDelta: 7,
    currentDelta: 0.04,
    flowMeasurementBias: 0,
    quality: "good",
    npshPenalty: 0,
    severity: "medium",
    evidence: [
      { parameter: "Flow", observation: "The operating point is materially below the configured target flow band.", contribution: "primary" },
      { parameter: "System resistance", observation: "The model attributes the shift to elevated hydraulic resistance.", contribution: "supporting" },
      { parameter: "Efficiency", observation: "Efficiency declines away from the best-efficiency region proxy.", contribution: "supporting" },
    ],
    maintenance: { asset: "P-101", condition: "Low-flow operating condition", action: "Inspect valve positions, filter differential pressure and downstream demand configuration.", inspectionWindow: "During the next operating check" },
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function healthBand(score: number): HealthBand {
  if (score >= 90) return "healthy";
  if (score >= 75) return "watch";
  if (score >= 50) return "warning";
  if (score >= 25) return "critical";
  return "severe";
}

export function scenarioDetails(scenario: ScenarioKind) {
  return scenarioConfiguration[scenario];
}

export function createSnapshot(scenario: ScenarioKind): TwinSnapshot {
  const config = scenarioConfiguration[scenario];
  const rpm = NOMINAL_RPM;
  const speedRatio = rpm / NOMINAL_RPM;
  const shutoffHead = 47 * speedRatio ** 2 * config.pumpHeadMultiplier;
  const pumpCurveCoefficient = 15_700_000;
  const staticHead = 1.8;
  const systemResistanceCoefficient = 76_000_000 * config.systemResistanceMultiplier;

  let low = 0;
  let high = 0.00135;
  for (let iteration = 0; iteration < 60; iteration += 1) {
    const flow = (low + high) / 2;
    const pumpHead = shutoffHead - pumpCurveCoefficient * flow ** 2;
    const systemHead = staticHead + systemResistanceCoefficient * flow ** 2;
    if (pumpHead > systemHead) low = flow;
    else high = flow;
  }

  const trueFlow = (low + high) / 2;
  const pumpHead = Math.max(staticHead, shutoffHead - pumpCurveCoefficient * trueFlow ** 2);
  const flowLpm = trueFlow * 60_000;
  const reportedFlowLpm = flowLpm * (1 + config.flowMeasurementBias);
  const differentialPressureBar = WATER_DENSITY_KG_M3 * GRAVITY_M_S2 * pumpHead / 100_000;
  const suctionPressureBar = 0.18 - (scenario === "cavitationLike" ? 0.09 : 0);
  const dischargePressureBar = suctionPressureBar + differentialPressureBar;
  const hydraulicPower = WATER_DENSITY_KG_M3 * GRAVITY_M_S2 * trueFlow * pumpHead;
  const expectedFlow = NOMINAL_FLOW_M3_S * 60_000;
  const operatingOffset = Math.abs(trueFlow / NOMINAL_FLOW_M3_S - 1);
  const efficiency = clamp(0.7 - 0.22 * operatingOffset - config.efficiencyPenalty, 0.29, 0.72);
  const electricalInput = hydraulicPower / efficiency;
  const baseTemperature = 35 + 7 * (electricalInput / 500);
  const temperature = baseTemperature + config.temperatureDelta;
  const vibration = config.vibrationBase + 0.25 * operatingOffset;
  const current = electricalInput / NOMINAL_VOLTAGE + config.currentDelta;
  const npshMargin = Math.max(0.1, 2.3 - config.npshPenalty - 0.25 * operatingOffset);
  const flowResidual = (reportedFlowLpm - expectedFlow) / expectedFlow * 100;

  const vibrationPenalty = clamp((vibration - 0.75) * 9, 0, 36);
  const temperaturePenalty = clamp((temperature - 41) * 0.95, 0, 32);
  const flowPenalty = clamp(Math.abs(flowResidual) * 0.33, 0, 18);
  const efficiencyPenalty = clamp((0.65 - efficiency) * 58, 0, 17);
  const qualityPenalty = config.quality === "suspect" ? 8 : config.quality === "degraded" ? 4 : 0;
  const healthScore = Math.round(clamp(100 - vibrationPenalty - temperaturePenalty - flowPenalty - efficiencyPenalty - qualityPenalty, 5, 99));
  const band = healthBand(healthScore);
  const anomalyScore = Math.round(clamp(100 - healthScore + (scenario === "normal" ? 1 : 4), 1, 99));
  const confidence = config.quality === "good" ? 88 : config.quality === "degraded" ? 71 : 58;

  return {
    asset: {
      tag: "P-101",
      name: "SmartPump-X recirculation pump",
      service: "Low-pressure water loop demonstrator",
      operatingState: band === "healthy" || band === "watch" ? "running" : band === "severe" || band === "critical" ? "critical" : "warning",
    },
    scenario,
    scenarioLabel: config.label,
    dataStatus: {
      origin: "synthetic",
      quality: config.quality,
      notice: scenario === "normal" ? "Synthetic physics-based demonstration data. No sensor validation is claimed." : "Synthetic fault-injection preview. This is not a physical fault confirmation.",
    },
    health: { score: healthScore, band, confidence },
    sensors: {
      flow: { value: round(reportedFlowLpm), unit: "L/min", origin: "synthetic", quality: config.quality },
      suctionPressure: { value: round(suctionPressureBar, 2), unit: "bar(g)", origin: "synthetic", quality: "good" },
      dischargePressure: { value: round(dischargePressureBar, 2), unit: "bar(g)", origin: "synthetic", quality: "good" },
      differentialPressure: { value: round(differentialPressureBar, 2), unit: "bar", origin: "calculated", quality: config.quality },
      temperature: { value: round(temperature), unit: "°C", origin: "synthetic", quality: "good" },
      vibration: { value: round(vibration, 2), unit: "mm/s RMS", origin: "synthetic", quality: "good" },
      rpm: { value: rpm, unit: "rpm", origin: "synthetic", quality: "good" },
      voltage: { value: NOMINAL_VOLTAGE, unit: "V DC", origin: "synthetic", quality: "good" },
      current: { value: round(current, 2), unit: "A", origin: "calculated", quality: config.quality },
      realPower: { value: round(electricalInput), unit: "W", origin: "calculated", quality: config.quality },
    },
    calculations: {
      headM: round(pumpHead, 2),
      hydraulicPowerW: round(hydraulicPower),
      electricalInputW: round(electricalInput),
      wireToWaterEfficiencyPct: round(efficiency * 100, 1),
      expectedFlowLpm: round(expectedFlow),
      flowResidualPct: round(flowResidual, 1),
      npshMarginM: round(npshMargin, 2),
    },
    anomaly: {
      score: anomalyScore,
      probableCondition: config.likelyCondition,
      severity: config.severity,
      evidence: config.evidence,
    },
    maintenance: config.maintenance,
  };
}

export function createTrend(scenario: ScenarioKind, windowMinutes: number): TrendPoint[] {
  const snapshot = createSnapshot(scenario);
  const points = 36;
  const stepMinutes = windowMinutes / (points - 1);
  const now = Date.now();
  const isFaulted = scenario !== "normal";

  return Array.from({ length: points }, (_, index) => {
    const progression = isFaulted ? Math.max(0, (index - 16) / 19) : 0;
    const ripple = Math.sin(index * 0.72) * 0.55;
    const temperatureRise = (snapshot.sensors.temperature.value - 39) * progression;
    const vibrationRise = (snapshot.sensors.vibration.value - 0.82) * progression;
    const healthDrop = (96 - snapshot.health.score) * progression;
    const flowShift = (snapshot.sensors.flow.value - 42) * progression;
    return {
      timestamp: now - Math.round((points - 1 - index) * stepMinutes * 60_000),
      flowLpm: round(42 + flowShift + ripple, 1),
      pressureBar: round(3.76 + (snapshot.sensors.differentialPressure.value - 3.76) * progression + ripple * 0.02, 2),
      temperatureC: round(39 + temperatureRise + ripple * 0.25, 1),
      vibrationMmS: round(0.82 + vibrationRise + ripple * 0.04, 2),
      healthScore: Math.round(96 - healthDrop - ripple * 0.5),
      realPowerW: round(440 + (snapshot.sensors.realPower.value - 440) * progression + ripple * 2, 1),
    };
  });
}
