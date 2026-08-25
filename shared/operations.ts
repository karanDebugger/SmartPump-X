export const commissioningChecklist = [
  { key: "mechanical-guard", group: "Mechanical safety", title: "Rotating assembly guard and frame anchoring verified", evidence: "Photograph and torque/fastener check" },
  { key: "leak-test", group: "Hydraulic integrity", title: "Low-pressure leak and drain-path test completed", evidence: "Pressure hold record and inspection note" },
  { key: "sensor-calibration", group: "Instrumentation", title: "Flow, pressure, temperature and vibration channels calibrated", evidence: "Reference comparison and calibration revision" },
  { key: "electrical-isolation", group: "Electrical safety", title: "Low-voltage supply, fuse and wet-area isolation verified", evidence: "Electrical inspection checklist" },
  { key: "fault-protocol", group: "Test governance", title: "Fault-injection protocol and stop conditions approved", evidence: "Approved risk assessment and test plan" },
] as const;

export const starterBom = [
  { assembly: "Hydraulic loop", component: "Low-voltage centrifugal pump", quantity: 1, material: "Engineered polymer / stainless wetted parts", specification: "Target curve to be selected after design-point freeze", status: "to_select" },
  { assembly: "Hydraulic loop", component: "Transparent test section", quantity: 1, material: "Pressure-rated clear tubing", specification: "Pressure and temperature rating required", status: "to_select" },
  { assembly: "Instrumentation", component: "Flow sensor FT-101", quantity: 1, material: "Application-dependent", specification: "Calibrated range must cover design flow", status: "to_select" },
  { assembly: "Instrumentation", component: "Pressure sensors PT-101 / PT-102", quantity: 2, material: "316 stainless or compatible polymer", specification: "Suction and discharge locations with documented ranges", status: "to_select" },
  { assembly: "Controls", component: "ESP32 edge controller", quantity: 1, material: "FR-4 PCB", specification: "Isolated low-voltage enclosure and watchdog firmware", status: "selected" },
  { assembly: "Safety", component: "Containment tray and splash guard", quantity: 1, material: "Chemical-compatible polymer", specification: "Protects electrical components and operators", status: "to_select" },
] as const;

export const mqttBridgeContract = {
  topic: "smartpump/{assetTag}/telemetry",
  transport: "MQTT broker → authenticated HTTP bridge → SmartPump-X ingestion API",
  requiredFields: ["assetTag", "sensorKey", "metric", "value", "unit", "capturedAt", "calibrationRevision"],
  excludedFields: ["command", "setpoint", "start", "stop", "speed", "actuator"],
  safety: "Ingestion is one-way. SmartPump-X does not publish MQTT commands or operate pump hardware.",
} as const;

export type TelemetryQualitySummary = {
  source: "database" | "no_accepted_telemetry";
  status: "nominal" | "attention" | "unavailable";
  acceptedSamples: number;
  latestCapturedAt: number | null;
  ageMinutes: number | null;
  qualityBreakdown: Array<{ quality: "good" | "degraded" | "suspect" | "missing"; count: number }>;
  metrics: Array<{ metric: string; unit: string; latestValue: number; capturedAt: number; quality: "good" | "degraded" | "suspect" | "missing"; samples: number }>;
  rejectionGuards: string[];
  summary: string;
  notice: string;
};
