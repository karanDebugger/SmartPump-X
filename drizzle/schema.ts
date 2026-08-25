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
