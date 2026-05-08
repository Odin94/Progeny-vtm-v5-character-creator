CREATE TABLE `impersonation_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`superadmin_user_id` text NOT NULL,
	`impersonated_user_id` text NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	`ended_at` integer,
	`ended_reason` text,
	`audit_log` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`superadmin_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`impersonated_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `impersonation_sessions_superadmin_user_id_idx` ON `impersonation_sessions` (`superadmin_user_id`);--> statement-breakpoint
CREATE INDEX `impersonation_sessions_impersonated_user_id_idx` ON `impersonation_sessions` (`impersonated_user_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `is_superadmin` integer DEFAULT false NOT NULL;
