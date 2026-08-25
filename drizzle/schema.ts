import { bigint, decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "engineer", "viewer", "user"]).default("viewer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const pumpAssets = mysqlTable("pumpAssets", {
  id: int("id").autoincrement().primaryKey(),
  tag: varchar("tag", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  service: varchar("service", { length: 160 }).notNull(),
  lifecycleState: mysqlEnum("lifecycleState", ["commissioning", "active", "maintenance", "retired"]).default("commissioning").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const simulationScenarios = mysqlTable("simulationScenarios", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 160 }).notNull(),
  origin: mysqlEnum("origin", ["synthetic"]).default("synthetic").notNull(),
  seedVersion: varchar("seedVersion", { length: 64 }).notNull(),
  enabled: int("enabled").default(1).notNull(),
  configuration: json("configuration"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const simulationRuns = mysqlTable("simulationRuns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  scenario: varchar("scenario", { length: 64 }).notNull(),
  datasetVersion: varchar("datasetVersion", { length: 64 }).notNull(),
  operatorNote: varchar("operatorNote", { length: 500 }).notNull(),
  mode: mysqlEnum("mode", ["preview_only"]).default("preview_only").notNull(),
  status: mysqlEnum("status", ["submitted", "reviewed"]).default("submitted").notNull(),
  requestedAt: bigint("requestedAt", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sensorCalibrations = mysqlTable("sensorCalibrations", {
  id: int("id").autoincrement().primaryKey(),
  assetTag: varchar("assetTag", { length: 32 }).notNull(),
  sensorKey: varchar("sensorKey", { length: 64 }).notNull(),
  metric: varchar("metric", { length: 64 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  rangeMin: decimal("rangeMin", { precision: 14, scale: 5 }).notNull(),
  rangeMax: decimal("rangeMax", { precision: 14, scale: 5 }).notNull(),
  revision: varchar("revision", { length: 32 }).notNull(),
  validUntil: bigint("validUntil", { mode: "number" }).notNull(),
  status: mysqlEnum("status", ["draft", "active", "expired", "retired"]).default("draft").notNull(),
  approvedBy: int("approvedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bomItems = mysqlTable("bomItems", {
  id: int("id").autoincrement().primaryKey(),
  assembly: varchar("assembly", { length: 80 }).notNull(),
  component: varchar("component", { length: 160 }).notNull(),
  quantity: int("quantity").notNull(),
  material: varchar("material", { length: 160 }).notNull(),
  specification: text("specification").notNull(),
  status: mysqlEnum("status", ["to_select", "selected", "ordered", "received"]).default("to_select").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const commissioningChecks = mysqlTable("commissioningChecks", {
  id: int("id").autoincrement().primaryKey(),
  checkKey: varchar("checkKey", { length: 80 }).notNull().unique(),
  groupName: varchar("groupName", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  evidenceRequirement: varchar("evidenceRequirement", { length: 255 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  status: mysqlEnum("status", ["not_started", "in_review", "verified", "blocked"]).default("not_started").notNull(),
  verifiedBy: int("verifiedBy").references(() => users.id),
  verifiedAt: bigint("verifiedAt", { mode: "number" }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const faultTestRequests = mysqlTable("faultTestRequests", {
  id: int("id").autoincrement().primaryKey(),
  assetTag: varchar("assetTag", { length: 32 }).notNull(),
  scenario: varchar("scenario", { length: 64 }).notNull(),
  objective: varchar("objective", { length: 500 }).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).notNull(),
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(),
  requestedBy: int("requestedBy").notNull().references(() => users.id),
  status: mysqlEnum("status", ["requested", "approved", "rejected", "executed", "closed"]).default("requested").notNull(),
  approvedBy: int("approvedBy").references(() => users.id),
  approvalNote: varchar("approvalNote", { length: 500 }),
  approvedAt: bigint("approvedAt", { mode: "number" }),
  noActuation: int("noActuation").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const faultTestEvents = mysqlTable("faultTestEvents", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => faultTestRequests.id),
  eventType: varchar("eventType", { length: 32 }).notNull(),
  actorId: int("actorId").references(() => users.id),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const telemetry = mysqlTable("telemetry", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull().references(() => pumpAssets.id),
  capturedAt: bigint("capturedAt", { mode: "number" }).notNull(),
  metric: varchar("metric", { length: 64 }).notNull(),
  value: decimal("value", { precision: 14, scale: 5 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  origin: mysqlEnum("origin", ["measured", "calculated", "estimated", "synthetic"]).notNull(),
  quality: mysqlEnum("quality", ["good", "degraded", "suspect", "missing"]).default("good").notNull(),
  calibrationRevision: varchar("calibrationRevision", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const healthAssessments = mysqlTable("healthAssessments", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull().references(() => pumpAssets.id),
  assessedAt: bigint("assessedAt", { mode: "number" }).notNull(),
  score: int("score").notNull(),
  band: mysqlEnum("band", ["healthy", "watch", "warning", "critical", "severe"]).notNull(),
  confidence: int("confidence").notNull(),
  modelVersion: varchar("modelVersion", { length: 64 }).notNull(),
  evidence: json("evidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const conditionEvents = mysqlTable("conditionEvents", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull().references(() => pumpAssets.id),
  detectedAt: bigint("detectedAt", { mode: "number" }).notNull(),
  scenario: varchar("scenario", { length: 64 }).notNull(),
  severity: mysqlEnum("severity", ["none", "low", "medium", "high", "critical"]).notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).default("open").notNull(),
  origin: mysqlEnum("origin", ["measured", "calculated", "estimated", "synthetic"]).notNull(),
  evidence: json("evidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const maintenanceRecommendations = mysqlTable("maintenanceRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull().references(() => pumpAssets.id),
  eventId: int("eventId").references(() => conditionEvents.id),
  condition: varchar("condition", { length: 255 }).notNull(),
  action: text("action").notNull(),
  inspectionWindow: varchar("inspectionWindow", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["proposed", "accepted", "completed", "dismissed"]).default("proposed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
