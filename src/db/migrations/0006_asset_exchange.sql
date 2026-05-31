ALTER TABLE "asset_catalog" ADD COLUMN "exchange" varchar(32);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "exchange" varchar(32);
