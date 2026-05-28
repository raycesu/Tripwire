CREATE TABLE "alert_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_rule_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"score_snapshot_id" uuid NOT NULL,
	"triggered_value" numeric(5, 2) NOT NULL,
	"message" text NOT NULL,
	"telegram_status" varchar(32) NOT NULL,
	"telegram_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_delivery_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"telegram_chat_id" text,
	"status" varchar(32) DEFAULT 'disconnected' NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_delivery_state_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_score_snapshot_id_score_snapshots_id_fk" FOREIGN KEY ("score_snapshot_id") REFERENCES "public"."score_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_delivery_state" ADD CONSTRAINT "telegram_delivery_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alert_events_rule_snapshot_unique" ON "alert_events" USING btree ("alert_rule_id","score_snapshot_id");--> statement-breakpoint
CREATE INDEX "alert_events_user_created_idx" ON "alert_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "alert_events_telegram_status_sent_idx" ON "alert_events" USING btree ("telegram_status","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_delivery_state_user_unique" ON "telegram_delivery_state" USING btree ("user_id");