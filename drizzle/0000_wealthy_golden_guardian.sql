CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`check_in_id` text NOT NULL,
	`sender_email` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`check_in_id`) REFERENCES `check_ins`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_email`) REFERENCES `profiles`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chat_messages_check_in_created_idx` ON `chat_messages` (`check_in_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `check_ins` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`energy` text NOT NULL,
	`pleasant` integer NOT NULL,
	`quadrant` text NOT NULL,
	`emotion` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`match_mode` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_email`) REFERENCES `profiles`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `check_ins_user_created_idx` ON `check_ins` (`user_email`,`created_at`);--> statement-breakpoint
CREATE TABLE `conversation_surveys` (
	`id` text PRIMARY KEY NOT NULL,
	`check_in_id` text NOT NULL,
	`user_email` text NOT NULL,
	`understood` text NOT NULL,
	`mood_change` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`check_in_id`) REFERENCES `check_ins`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_email`) REFERENCES `profiles`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conversation_surveys_check_in_idx` ON `conversation_surveys` (`check_in_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`email` text PRIMARY KEY NOT NULL,
	`age` integer NOT NULL,
	`gender` text NOT NULL,
	`custom_gender` text DEFAULT '' NOT NULL,
	`country` text NOT NULL,
	`languages` text NOT NULL,
	`terms_accepted` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
