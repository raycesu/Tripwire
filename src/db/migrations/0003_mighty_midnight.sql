CREATE TABLE "scheduled_job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_name" varchar(64) NOT NULL,
	"triggered_by" varchar(32) NOT NULL,
	"status" varchar(32) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"assets_attempted" integer,
	"assets_succeeded" integer,
	"assets_failed" integer,
	"error_json" jsonb,
	"metadata_json" jsonb
);
--> statement-breakpoint
CREATE INDEX "scheduled_job_runs_job_name_started_idx" ON "scheduled_job_runs" USING btree ("job_name","started_at");