CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`area` text NOT NULL,
	`category` text NOT NULL,
	`date` text NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL,
	`notes` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`photos` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_entries_owner_date` ON `entries` (`owner_id`,`date`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_photos_owner` ON `photos` (`owner_id`);