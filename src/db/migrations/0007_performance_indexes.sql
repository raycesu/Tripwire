CREATE INDEX IF NOT EXISTS "score_snapshots_asset_computed_idx" ON "score_snapshots" USING btree ("asset_id","computed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "score_snapshots_asset_sector_valid_date_idx" ON "score_snapshots" USING btree ("asset_id","sector","valid_for_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_telegram_connect_code_idx" ON "users" USING btree ("telegram_connect_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_cache_expires_at_idx" ON "provider_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alert_events_rule_status_sent_idx" ON "alert_events" USING btree ("alert_rule_id","telegram_status","sent_at");
