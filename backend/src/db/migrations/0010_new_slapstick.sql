CREATE TABLE `coterie_homebrew_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`coterie_id` text NOT NULL,
	`collection_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`coterie_id`) REFERENCES `coteries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `homebrew_collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coterie_homebrew_collections_coterie_id_idx` ON `coterie_homebrew_collections` (`coterie_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `coterie_homebrew_collections_unique_idx` ON `coterie_homebrew_collections` (`coterie_id`,`collection_id`);--> statement-breakpoint
CREATE TABLE `homebrew_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`short_description` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`content_warning` text DEFAULT '' NOT NULL,
	`source_library_entry_id` text,
	`source_publication_id` text,
	`root_source_library_entry_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `homebrew_collections_owner_id_idx` ON `homebrew_collections` (`owner_id`);--> statement-breakpoint
CREATE TABLE `homebrew_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`library_entry_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`library_entry_id`) REFERENCES `homebrew_library_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `homebrew_comments_entry_created_idx` ON `homebrew_comments` (`library_entry_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `homebrew_items` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `homebrew_collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `homebrew_items_collection_id_idx` ON `homebrew_items` (`collection_id`);--> statement-breakpoint
CREATE TABLE `homebrew_library_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`original_collection_id` text,
	`author_id` text,
	`author_nickname` text NOT NULL,
	`active_publication_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`unpublished_at` integer,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `homebrew_library_entries_author_id_idx` ON `homebrew_library_entries` (`author_id`);--> statement-breakpoint
CREATE TABLE `homebrew_publications` (
	`id` text PRIMARY KEY NOT NULL,
	`library_entry_id` text NOT NULL,
	`version` integer NOT NULL,
	`snapshot` text NOT NULL,
	`approved_by_id` text,
	`approved_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`library_entry_id`) REFERENCES `homebrew_library_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `homebrew_publications_library_entry_id_idx` ON `homebrew_publications` (`library_entry_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `homebrew_publications_unique_version_idx` ON `homebrew_publications` (`library_entry_id`,`version`);--> statement-breakpoint
CREATE TABLE `homebrew_publish_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text,
	`requester_id` text NOT NULL,
	`library_entry_id` text,
	`snapshot` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`denial_message` text,
	`reviewed_by_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`collection_id`) REFERENCES `homebrew_collections`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`library_entry_id`) REFERENCES `homebrew_library_entries`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `homebrew_publish_requests_requester_id_idx` ON `homebrew_publish_requests` (`requester_id`);--> statement-breakpoint
CREATE INDEX `homebrew_publish_requests_status_idx` ON `homebrew_publish_requests` (`status`);--> statement-breakpoint
CREATE INDEX `homebrew_publish_requests_created_at_idx` ON `homebrew_publish_requests` (`created_at`);--> statement-breakpoint
CREATE TABLE `homebrew_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`library_entry_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`library_entry_id`) REFERENCES `homebrew_library_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `homebrew_ratings_unique_idx` ON `homebrew_ratings` (`library_entry_id`,`user_id`);