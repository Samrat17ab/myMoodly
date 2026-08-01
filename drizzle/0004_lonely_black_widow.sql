DROP TABLE `magic_link_tokens`;--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`code_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	`requested_at` integer DEFAULT (unixepoch()) NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`used_at` integer
);
--> statement-breakpoint
CREATE INDEX `otp_codes_email_requested_idx` ON `otp_codes` (`email`,`requested_at`);
