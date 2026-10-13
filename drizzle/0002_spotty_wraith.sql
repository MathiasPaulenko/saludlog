CREATE TABLE `meal_plan_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_of_week` integer NOT NULL,
	`meal_type` text NOT NULL,
	`food_id` integer NOT NULL,
	`amount` real NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action
);
