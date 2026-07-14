CREATE TABLE `character_note_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `character_note_versions_character_user_idx` ON `character_note_versions` (`character_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `character_note_versions_created_at_idx` ON `character_note_versions` (`created_at`);