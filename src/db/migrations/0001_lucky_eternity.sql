CREATE TABLE "provider_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" varchar(191) NOT NULL,
	"provider" varchar(64) NOT NULL,
	"payload_json" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "provider_cache_cache_key_unique" ON "provider_cache" USING btree ("cache_key");