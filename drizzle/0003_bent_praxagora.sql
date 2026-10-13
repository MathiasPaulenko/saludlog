CREATE TABLE `training_plan_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_of_week` integer NOT NULL,
	`title` text NOT NULL,
	`workout_type` text DEFAULT 'gym' NOT NULL,
	`routine_id` integer,
	`duration_min` integer,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE set null
);
