CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"scope" varchar(16) NOT NULL,
	"sector" varchar(32),
	"operator" varchar(16) DEFAULT 'above' NOT NULL,
	"threshold" numeric(5, 2) NOT NULL,
	"cooldown_minutes" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(32) NOT NULL,
	"name" varchar(191) NOT NULL,
	"asset_type" varchar(16) NOT NULL,
	"provider_symbol" varchar(64),
	"provider_name" varchar(64),
	"quote_asset" varchar(16),
	"benchmark_symbol" varchar(32),
	"resolution_status" varchar(32) DEFAULT 'needs_review' NOT NULL,
	"unsupported_reason" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"sector" varchar(32) NOT NULL,
	"score" text,
	"is_null" boolean DEFAULT false NOT NULL,
	"null_reason" text,
	"is_stale" boolean DEFAULT false NOT NULL,
	"components_json" jsonb,
	"source_metadata_json" jsonb,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_for_date" timestamp with time zone NOT NULL,
	"cadence" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(191) NOT NULL,
	"telegram_chat_id" text,
	"telegram_connect_code" text,
	"telegram_connect_code_expires_at" timestamp with time zone,
	"telegram_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_rules_user_asset_idx" ON "alert_rules" USING btree ("user_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_symbol_unique" ON "assets" USING btree ("symbol");--> statement-breakpoint
CREATE UNIQUE INDEX "score_snapshots_asset_sector_date_cadence_unique" ON "score_snapshots" USING btree ("asset_id","sector","valid_for_date","cadence");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_items_user_asset_unique" ON "watchlist_items" USING btree ("user_id","asset_id");