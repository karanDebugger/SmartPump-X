CREATE TABLE `simulationRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenario` varchar(64) NOT NULL,
	`datasetVersion` varchar(64) NOT NULL,
	`operatorNote` varchar(500) NOT NULL,
	`mode` enum('preview_only') NOT NULL DEFAULT 'preview_only',
	`status` enum('submitted','reviewed') NOT NULL DEFAULT 'submitted',
	`requestedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulationRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `simulationRuns` ADD CONSTRAINT `simulationRuns_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;