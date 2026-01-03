CREATE TABLE `character_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`shared_with_user_id` text NOT NULL,
	`shared_by_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_with_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `character_shares_character_id_idx` ON `character_shares` (`character_id`);--> statement-breakpoint
CREATE INDEX `character_shares_shared_with_user_id_idx` ON `character_shares` (`shared_with_user_id`);--> statement-breakpoint
CREATE INDEX `character_shares_unique_idx` ON `character_shares` (`character_id`,`shared_with_user_id`);--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `characters_user_id_idx` ON `characters` (`user_id`);--> statement-breakpoint
CREATE TABLE `coterie_members` (
	`id` text PRIMARY KEY NOT NULL,
	`coterie_id` text NOT NULL,
	`character_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`coterie_id`) REFERENCES `coteries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coterie_members_coterie_id_idx` ON `coterie_members` (`coterie_id`);--> statement-breakpoint
CREATE INDEX `coterie_members_character_id_idx` ON `coterie_members` (`character_id`);--> statement-breakpoint
CREATE TABLE `coteries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);