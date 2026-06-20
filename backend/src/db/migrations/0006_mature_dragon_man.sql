CREATE TABLE `coterie_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`coterie_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`coterie_id`) REFERENCES `coteries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coterie_invites_coterie_id_idx` ON `coterie_invites` (`coterie_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `coterie_invites_token_hash_unique_idx` ON `coterie_invites` (`token_hash`);--> statement-breakpoint
CREATE TABLE `coterie_player_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`coterie_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`coterie_id`) REFERENCES `coteries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coterie_player_memberships_coterie_id_idx` ON `coterie_player_memberships` (`coterie_id`);--> statement-breakpoint
CREATE INDEX `coterie_player_memberships_user_id_idx` ON `coterie_player_memberships` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `coterie_player_memberships_unique_idx` ON `coterie_player_memberships` (`coterie_id`,`user_id`);--> statement-breakpoint
INSERT INTO `coterie_player_memberships` (`id`, `coterie_id`, `user_id`)
SELECT lower(hex(randomblob(16))), `coteries`.`id`, `coteries`.`owner_id`
FROM `coteries`
WHERE NOT EXISTS (
	SELECT 1
	FROM `coterie_player_memberships`
	WHERE `coterie_player_memberships`.`coterie_id` = `coteries`.`id`
	AND `coterie_player_memberships`.`user_id` = `coteries`.`owner_id`
);
