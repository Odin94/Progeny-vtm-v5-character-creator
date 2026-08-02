CREATE TABLE `user_homebrew_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`collection_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `homebrew_collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_homebrew_collections_user_id_idx` ON `user_homebrew_collections` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_homebrew_collections_unique_idx` ON `user_homebrew_collections` (`user_id`,`collection_id`);