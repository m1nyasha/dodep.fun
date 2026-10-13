CREATE TABLE `agent_decisions` (
	`id` binary(16) NOT NULL,
	`experiment_id` binary(16) NOT NULL,
	`agent_id` binary(16) NOT NULL,
	`action` enum('bet','open','cash_out','stop') NOT NULL,
	`amount` bigint,
	`cell` tinyint,
	`reason` varchar(240) NOT NULL,
	`model_id` varchar(120) NOT NULL,
	`input_tokens` int NOT NULL DEFAULT 0,
	`output_tokens` int NOT NULL DEFAULT 0,
	`result` json NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `agent_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experiment_agents` (
	`id` binary(16) NOT NULL,
	`experiment_id` binary(16) NOT NULL,
	`user_id` binary(16) NOT NULL,
	`profile_key` varchar(40) NOT NULL,
	`slot` int NOT NULL,
	`status` enum('running','stopped','technical_stop') NOT NULL DEFAULT 'running',
	`stop_reason` varchar(255),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`finished_at` datetime(3),
	CONSTRAINT `experiment_agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `experiment_agents_slot_uq` UNIQUE(`experiment_id`,`profile_key`,`slot`),
	CONSTRAINT `experiment_agents_user_uq` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `experiments` ADD `external_key` varchar(120);--> statement-breakpoint
ALTER TABLE `experiments` ADD `manifest` json;--> statement-breakpoint
ALTER TABLE `experiments` ADD `max_rounds` int;--> statement-breakpoint
UPDATE `experiments` SET `external_key` = CONCAT('legacy_', HEX(`id`)), `manifest` = JSON_OBJECT('legacy', TRUE), `max_rounds` = 50 WHERE `external_key` IS NULL;--> statement-breakpoint
ALTER TABLE `experiments` MODIFY `external_key` varchar(120) NOT NULL, MODIFY `manifest` json NOT NULL, MODIFY `max_rounds` int NOT NULL;--> statement-breakpoint
ALTER TABLE `experiments` ADD CONSTRAINT `experiments_external_key_unique` UNIQUE(`external_key`);--> statement-breakpoint
ALTER TABLE `agent_decisions` ADD CONSTRAINT `agent_decisions_experiment_id_experiments_id_fk` FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_decisions` ADD CONSTRAINT `agent_decisions_agent_id_experiment_agents_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `experiment_agents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experiment_agents` ADD CONSTRAINT `experiment_agents_experiment_id_experiments_id_fk` FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experiment_agents` ADD CONSTRAINT `experiment_agents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `agent_decisions_experiment_idx` ON `agent_decisions` (`experiment_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `agent_decisions_agent_idx` ON `agent_decisions` (`agent_id`,`created_at`);
