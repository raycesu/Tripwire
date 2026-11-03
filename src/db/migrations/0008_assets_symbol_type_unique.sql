DROP INDEX "assets_symbol_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "assets_symbol_type_unique" ON "assets" USING btree ("symbol","asset_type");
