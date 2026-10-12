CREATE TABLE `admin_actions` (
	`id` binary(16) NOT NULL,
	`admin_id` binary(16) NOT NULL,
	`action` enum('block','unblock','hide_status','show_status','rules_create','rules_activate','settings_update') NOT NULL,
	`target_user_id` binary(16),
	`payload` json,
	`reason` varchar(255),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `admin_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_fingerprints` (
	`id` binary(16) NOT NULL,
	`user_id` binary(16),
	`event` enum('register','login','register_denied') NOT NULL,
	`ip` varchar(45) NOT NULL,
	`user_agent` varchar(512) NOT NULL,
	`accept_language` varchar(255) NOT NULL,
	`client_hash` varchar(64),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `auth_fingerprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` binary(16) NOT NULL,
	`name` varchar(120) NOT NULL,
	`rule_version_id` binary(16) NOT NULL,
	`started_at` datetime(3) NOT NULL,
	`finished_at` datetime(3),
	CONSTRAINT `experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ledger` (
	`id` binary(16) NOT NULL,
	`user_id` binary(16) NOT NULL,
	`kind` enum('signup','bet','payout','daily') NOT NULL,
	`amount` bigint NOT NULL,
	`balance_before` bigint NOT NULL,
	`balance_after` bigint NOT NULL,
	`round_id` binary(16),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `round_actions` (
	`id` binary(16) NOT NULL,
	`round_id` binary(16) NOT NULL,
	`seq` int NOT NULL,
	`type` enum('open','cash_out') NOT NULL,
	`cell` tinyint,
	`result` enum('safe','mine'),
	`safe_before` int NOT NULL,
	`multiplier` decimal(14,6) NOT NULL,
	`potential_payout` bigint NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `round_actions_id` PRIMARY KEY(`id`),
	CONSTRAINT `round_actions_seq_uq` UNIQUE(`round_id`,`seq`)
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` binary(16) NOT NULL,
	`user_id` binary(16) NOT NULL,
	`rule_version_id` binary(16) NOT NULL,
	`experiment_id` binary(16),
	`round_no` int NOT NULL,
	`client` enum('web','agent') NOT NULL DEFAULT 'web',
	`random_source` enum('SYSTEM_CSPRNG') NOT NULL DEFAULT 'SYSTEM_CSPRNG',
	`bet` bigint NOT NULL,
	`balance_before` bigint NOT NULL,
	`balance_after` bigint,
	`status` enum('active','cashed_out','hit_mine') NOT NULL DEFAULT 'active',
	`end_reason` enum('mine','cash_out','all_safe'),
	`safe_count` int NOT NULL DEFAULT 0,
	`multiplier` decimal(14,6),
	`payout` bigint NOT NULL DEFAULT 0,
	`mines` json NOT NULL,
	`salt` varchar(32) NOT NULL,
	`hash` varchar(64) NOT NULL,
	`hit_cell` tinyint,
	`started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`finished_at` datetime(3),
	`active_user_id` binary(16) GENERATED ALWAYS AS (if(status = 'active', user_id, null)) STORED,
	CONSTRAINT `rounds_id` PRIMARY KEY(`id`),
	CONSTRAINT `rounds_active_user_uq` UNIQUE(`active_user_id`),
	CONSTRAINT `rounds_user_no_uq` UNIQUE(`user_id`,`round_no`)
);
--> statement-breakpoint
CREATE TABLE `rule_versions` (
	`id` binary(16) NOT NULL,
	`version` int NOT NULL,
	`rtp` decimal(7,6) NOT NULL,
	`min_bet` bigint NOT NULL,
	`bet_step` bigint NOT NULL,
	`start_balance` bigint NOT NULL,
	`daily_target` bigint NOT NULL,
	`is_active` boolean NOT NULL DEFAULT false,
	`active_flag` tinyint GENERATED ALWAYS AS (if(is_active, 1, null)) STORED,
	`created_by` binary(16),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `rule_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `rule_versions_version_uq` UNIQUE(`version`),
	CONSTRAINT `rule_versions_active_uq` UNIQUE(`active_flag`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` binary(16) NOT NULL,
	`user_id` binary(16) NOT NULL,
	`kind` enum('user','admin','admin_ticket') NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`used_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(64) NOT NULL,
	`value` json NOT NULL,
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `status_history` (
	`id` binary(16) NOT NULL,
	`user_id` binary(16) NOT NULL,
	`text` varchar(72) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` binary(16) NOT NULL,
	`nickname` varchar(20) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`is_admin` boolean NOT NULL DEFAULT false,
	`is_ai` boolean NOT NULL DEFAULT false,
	`ai_type` varchar(40),
	`balance` bigint NOT NULL,
	`total_wagered` bigint NOT NULL DEFAULT 0,
	`total_payout` bigint NOT NULL DEFAULT 0,
	`rounds_count` int NOT NULL DEFAULT 0,
	`status_text` varchar(72),
	`status_updated_at` datetime(3),
	`status_hidden_at` datetime(3),
	`blocked_at` datetime(3),
	`block_reason` varchar(255),
	`last_daily_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_nickname_uq` UNIQUE(`nickname`)
);
--> statement-breakpoint
ALTER TABLE `admin_actions` ADD CONSTRAINT `admin_actions_admin_id_users_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_actions` ADD CONSTRAINT `admin_actions_target_user_id_users_id_fk` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auth_fingerprints` ADD CONSTRAINT `auth_fingerprints_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experiments` ADD CONSTRAINT `experiments_rule_version_id_rule_versions_id_fk` FOREIGN KEY (`rule_version_id`) REFERENCES `rule_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ledger` ADD CONSTRAINT `ledger_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ledger` ADD CONSTRAINT `ledger_round_id_rounds_id_fk` FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `round_actions` ADD CONSTRAINT `round_actions_round_id_rounds_id_fk` FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rounds` ADD CONSTRAINT `rounds_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rounds` ADD CONSTRAINT `rounds_rule_version_id_rule_versions_id_fk` FOREIGN KEY (`rule_version_id`) REFERENCES `rule_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rounds` ADD CONSTRAINT `rounds_experiment_id_experiments_id_fk` FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rule_versions` ADD CONSTRAINT `rule_versions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `status_history` ADD CONSTRAINT `status_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_actions_created_idx` ON `admin_actions` (`created_at`);--> statement-breakpoint
CREATE INDEX `auth_fp_ip_event_idx` ON `auth_fingerprints` (`ip`,`event`,`created_at`);--> statement-breakpoint
CREATE INDEX `auth_fp_user_idx` ON `auth_fingerprints` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_fp_client_idx` ON `auth_fingerprints` (`client_hash`);--> statement-breakpoint
CREATE INDEX `ledger_user_created_idx` ON `ledger` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `round_actions_cell_idx` ON `round_actions` (`cell`);--> statement-breakpoint
CREATE INDEX `rounds_experiment_idx` ON `rounds` (`experiment_id`);--> statement-breakpoint
CREATE INDEX `rounds_finished_idx` ON `rounds` (`finished_at`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `status_history_user_idx` ON `status_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_balance_idx` ON `users` (`balance`);