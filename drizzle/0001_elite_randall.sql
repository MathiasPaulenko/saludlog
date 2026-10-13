CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`level` text,
	`equipment` text,
	`primary_muscles` text,
	`secondary_muscles` text,
	`instructions` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_source_id_unique` ON `exercises` (`source_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_name_unique` ON `exercises` (`name`);--> statement-breakpoint
CREATE TABLE `routine_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`routine_id` integer NOT NULL,
	`position` integer NOT NULL,
	`exercise` text NOT NULL,
	`exercise_id` integer,
	`sets` integer NOT NULL,
	`reps` integer NOT NULL,
	`weight_kg` real,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `routines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `routines_name_unique` ON `routines` (`name`);--> statement-breakpoint
ALTER TABLE `workout_sets` ADD `exercise_id` integer REFERENCES exercises(id);