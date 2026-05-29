CREATE TABLE "api_rate_limits" (
	"key" varchar(191) PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
