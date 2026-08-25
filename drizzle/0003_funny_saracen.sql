CREATE TABLE `simulationScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`label` varchar(160) NOT NULL,
	`origin` enum('synthetic') NOT NULL DEFAULT 'synthetic',
	`seedVersion` varchar(64) NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`configuration` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulationScenarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `simulationScenarios_key_unique` UNIQUE(`key`)
);
