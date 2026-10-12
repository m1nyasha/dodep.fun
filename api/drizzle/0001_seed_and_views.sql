INSERT INTO `rule_versions` (`id`, `version`, `rtp`, `min_bet`, `bet_step`, `start_balance`, `daily_target`, `is_active`)
VALUES (UUID_TO_BIN(UUID()), 1, 0.973000, 100, 100, 10000, 10000, true);
--> statement-breakpoint
INSERT INTO `settings` (`key`, `value`) VALUES ('registration_limit', JSON_OBJECT('count', 5, 'windowHours', 24));
--> statement-breakpoint
CREATE VIEW `v_rounds` AS
SELECT
  r.`id`, r.`user_id`, u.`nickname`, u.`is_ai`, u.`ai_type`, r.`rule_version_id`, r.`experiment_id`,
  r.`round_no`, r.`client`, r.`bet`, r.`balance_before`, r.`balance_after`,
  r.`bet` / r.`balance_before` AS `bet_share`,
  r.`status`, r.`end_reason`, r.`safe_count`, r.`multiplier`, r.`payout`,
  r.`payout` - r.`bet` AS `net`,
  r.`hit_cell`, r.`started_at`, r.`finished_at`,
  TIMESTAMPDIFF(MICROSECOND, r.`started_at`, r.`finished_at`) / 1000 AS `duration_ms`,
  LAG(r.`status`) OVER w AS `prev_status`,
  LAG(r.`bet`) OVER w AS `prev_bet`,
  LAG(r.`safe_count`) OVER w AS `prev_safe_count`
FROM `rounds` r
JOIN `users` u ON u.`id` = r.`user_id`
WHERE r.`status` <> 'active'
WINDOW w AS (PARTITION BY r.`user_id` ORDER BY r.`round_no`);
