CREATE TABLE `coterie_note_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`coterie_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`coterie_id`) REFERENCES `coteries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coterie_note_versions_coterie_user_idx` ON `coterie_note_versions` (`coterie_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `coterie_note_versions_created_at_idx` ON `coterie_note_versions` (`created_at`);