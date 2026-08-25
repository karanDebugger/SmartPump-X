CREATE TABLE `bomItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assembly` varchar(80) NOT NULL,
	`component` varchar(160) NOT NULL,
	`quantity` int NOT NULL,
	`material` varchar(160) NOT NULL,
	`specification` text NOT NULL,
	`status` enum('to_select','selected','ordered','received') NOT NULL DEFAULT 'to_select',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bomItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissioningChecks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkKey` varchar(80) NOT NULL,
	`groupName` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`evidenceRequirement` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`status` enum('not_started','in_review','verified','blocked') NOT NULL DEFAULT 'not_started',
	`verifiedBy` int,
	`verifiedAt` bigint,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commissioningChecks_id` PRIMARY KEY(`id`),
	CONSTRAINT `commissioningChecks_checkKey_unique` UNIQUE(`checkKey`)
);
--> statement-breakpoint
CREATE TABLE `faultTestEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`eventType` varchar(32) NOT NULL,
	`actorId` int,
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `faultTestEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faultTestRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetTag` varchar(32) NOT NULL,
	`scenario` varchar(64) NOT NULL,
	`objective` varchar(500) NOT NULL,
	`riskLevel` enum('low','medium','high') NOT NULL,
	`scheduledAt` bigint NOT NULL,
	`requestedBy` int NOT NULL,
	`status` enum('requested','approved','rejected','executed','closed') NOT NULL DEFAULT 'requested',
	`approvedBy` int,
	`approvalNote` varchar(500),
	`approvedAt` bigint,
	`noActuation` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `faultTestRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensorCalibrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetTag` varchar(32) NOT NULL,
	`sensorKey` varchar(64) NOT NULL,
	`metric` varchar(64) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`rangeMin` decimal(14,5) NOT NULL,
	`rangeMax` decimal(14,5) NOT NULL,
	`revision` varchar(32) NOT NULL,
	`validUntil` bigint NOT NULL,
	`status` enum('draft','active','expired','retired') NOT NULL DEFAULT 'draft',
	`approvedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sensorCalibrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `commissioningChecks` ADD CONSTRAINT `commissioningChecks_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `faultTestEvents` ADD CONSTRAINT `faultTestEvents_requestId_faultTestRequests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `faultTestRequests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `faultTestEvents` ADD CONSTRAINT `faultTestEvents_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `faultTestRequests` ADD CONSTRAINT `faultTestRequests_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `faultTestRequests` ADD CONSTRAINT `faultTestRequests_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sensorCalibrations` ADD CONSTRAINT `sensorCalibrations_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;