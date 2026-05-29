CREATE TABLE "asset_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(32) NOT NULL,
	"name" varchar(191) NOT NULL,
	"asset_type" varchar(16) NOT NULL,
	"source" varchar(32) NOT NULL,
	"provider_symbol" varchar(64),
	"synced_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "asset_catalog_symbol_type_unique" ON "asset_catalog" USING btree ("symbol","asset_type");
--> statement-breakpoint
CREATE INDEX "asset_catalog_symbol_idx" ON "asset_catalog" USING btree ("symbol");
--> statement-breakpoint
CREATE INDEX "asset_catalog_asset_type_idx" ON "asset_catalog" USING btree ("asset_type");
