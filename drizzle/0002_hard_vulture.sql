ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','engineer','viewer','user') NOT NULL DEFAULT 'viewer';
CREATE TABLE `pumpAssets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tag` varchar(32) NOT NULL,
  `name` varchar(160) NOT NULL,
  `service` varchar(160) NOT NULL,
  `lifecycleState` enum('commissioning','active','maintenance','retired') NOT NULL DEFAULT 'commissioning',
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pumpAssets_id` PRIMARY KEY(`id`),
  CONSTRAINT `pumpAssets_tag_unique` UNIQUE(`tag`)
);
CREATE TABLE `telemetry` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assetId` int NOT NULL,
  `capturedAt` bigint NOT NULL,
  `metric` varchar(64) NOT NULL,
  `value` decimal(14,5) NOT NULL,
  `unit` varchar(32) NOT NULL,
  `origin` enum('measured','calculated','estimated','synthetic') NOT NULL,
  `quality` enum('good','degraded','suspect','missing') NOT NULL DEFAULT 'good',
  `calibrationRevision` varchar(32),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `telemetry_id` PRIMARY KEY(`id`),
  CONSTRAINT `telemetry_assetId_pumpAssets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `pumpAssets`(`id`) ON DELETE no action ON UPDATE no action
);
CREATE TABLE `healthAssessments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assetId` int NOT NULL,
  `assessedAt` bigint NOT NULL,
  `score` int NOT NULL,
  `band` enum('healthy','watch','warning','critical','severe') NOT NULL,
  `confidence` int NOT NULL,
  `modelVersion` varchar(64) NOT NULL,
  `evidence` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `healthAssessments_id` PRIMARY KEY(`id`),
  CONSTRAINT `healthAssessments_assetId_pumpAssets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `pumpAssets`(`id`) ON DELETE no action ON UPDATE no action
);
CREATE TABLE `conditionEvents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assetId` int NOT NULL,
  `detectedAt` bigint NOT NULL,
  `scenario` varchar(64) NOT NULL,
  `severity` enum('none','low','medium','high','critical') NOT NULL,
  `status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
  `origin` enum('measured','calculated','estimated','synthetic') NOT NULL,
  `evidence` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `conditionEvents_id` PRIMARY KEY(`id`),
  CONSTRAINT `conditionEvents_assetId_pumpAssets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `pumpAssets`(`id`) ON DELETE no action ON UPDATE no action
);
CREATE TABLE `maintenanceRecommendations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assetId` int NOT NULL,
  `eventId` int,
  `condition` varchar(255) NOT NULL,
  `action` text NOT NULL,
  `inspectionWindow` varchar(160) NOT NULL,
  `status` enum('proposed','accepted','completed','dismissed') NOT NULL DEFAULT 'proposed',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `maintenanceRecommendations_id` PRIMARY KEY(`id`),
  CONSTRAINT `maintenanceRecommendations_assetId_pumpAssets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `pumpAssets`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `maintenanceRecommendations_eventId_conditionEvents_id_fk` FOREIGN KEY (`eventId`) REFERENCES `conditionEvents`(`id`) ON DELETE no action ON UPDATE no action
);
