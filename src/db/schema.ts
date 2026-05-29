import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 191 }).notNull().unique(),
  telegramChatId: text("telegram_chat_id"),
  telegramConnectCode: text("telegram_connect_code"),
  telegramConnectCodeExpiresAt: timestamp("telegram_connect_code_expires_at", { withTimezone: true }),
  telegramVerifiedAt: timestamp("telegram_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const assetCatalog = pgTable(
  "asset_catalog",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    symbol: varchar("symbol", { length: 32 }).notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    assetType: varchar("asset_type", { length: 16 }).notNull(),
    source: varchar("source", { length: 32 }).notNull(),
    providerSymbol: varchar("provider_symbol", { length: 64 }),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("asset_catalog_symbol_type_unique").on(table.symbol, table.assetType),
    index("asset_catalog_symbol_idx").on(table.symbol),
    index("asset_catalog_asset_type_idx").on(table.assetType),
  ]
)

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    symbol: varchar("symbol", { length: 32 }).notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    assetType: varchar("asset_type", { length: 16 }).notNull(),
    providerSymbol: varchar("provider_symbol", { length: 64 }),
    providerName: varchar("provider_name", { length: 64 }),
    quoteAsset: varchar("quote_asset", { length: 16 }),
    benchmarkSymbol: varchar("benchmark_symbol", { length: 32 }),
    resolutionStatus: varchar("resolution_status", { length: 32 }).notNull().default("needs_review"),
    unsupportedReason: text("unsupported_reason"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("assets_symbol_unique").on(table.symbol)]
)

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("watchlist_items_user_asset_unique").on(table.userId, table.assetId)]
)

export const alertRules = pgTable(
  "alert_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    scope: varchar("scope", { length: 16 }).notNull(),
    sector: varchar("sector", { length: 32 }),
    operator: varchar("operator", { length: 16 }).notNull().default("above"),
    threshold: numeric("threshold", { precision: 5, scale: 2 }).notNull(),
    cooldownMinutes: integer("cooldown_minutes").notNull().default(0),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("alert_rules_user_asset_idx").on(table.userId, table.assetId)]
)

export const providerCache = pgTable(
  "provider_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cacheKey: varchar("cache_key", { length: 191 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    payloadJson: jsonb("payload_json").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("provider_cache_cache_key_unique").on(table.cacheKey)]
)

export const telegramDeliveryState = pgTable(
  "telegram_delivery_state",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    telegramChatId: text("telegram_chat_id"),
    status: varchar("status", { length: 32 }).notNull().default("disconnected"),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),
    lastError: text("last_error"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("telegram_delivery_state_user_unique").on(table.userId)]
)

export const scoreSnapshots = pgTable(
  "score_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    sector: varchar("sector", { length: 32 }).notNull(),
    score: text("score"),
    isNull: boolean("is_null").notNull().default(false),
    nullReason: text("null_reason"),
    isStale: boolean("is_stale").notNull().default(false),
    componentsJson: jsonb("components_json"),
    sourceMetadataJson: jsonb("source_metadata_json"),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
    validForDate: timestamp("valid_for_date", { withTimezone: true }).notNull(),
    cadence: varchar("cadence", { length: 32 }).notNull(),
  },
  (table) => [
    uniqueIndex("score_snapshots_asset_sector_date_cadence_unique").on(
      table.assetId,
      table.sector,
      table.validForDate,
      table.cadence
    ),
  ]
)

export const apiRateLimits = pgTable("api_rate_limits", {
  key: varchar("key", { length: 191 }).primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
})

export const scheduledJobRuns = pgTable(
  "scheduled_job_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobName: varchar("job_name", { length: 64 }).notNull(),
    triggeredBy: varchar("triggered_by", { length: 32 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    assetsAttempted: integer("assets_attempted"),
    assetsSucceeded: integer("assets_succeeded"),
    assetsFailed: integer("assets_failed"),
    errorJson: jsonb("error_json"),
    metadataJson: jsonb("metadata_json"),
  },
  (table) => [index("scheduled_job_runs_job_name_started_idx").on(table.jobName, table.startedAt)]
)

export const alertEvents = pgTable(
  "alert_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    alertRuleId: uuid("alert_rule_id")
      .notNull()
      .references(() => alertRules.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    scoreSnapshotId: uuid("score_snapshot_id")
      .notNull()
      .references(() => scoreSnapshots.id, { onDelete: "cascade" }),
    triggeredValue: numeric("triggered_value", { precision: 5, scale: 2 }).notNull(),
    message: text("message").notNull(),
    telegramStatus: varchar("telegram_status", { length: 32 }).notNull(),
    telegramError: text("telegram_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("alert_events_rule_snapshot_unique").on(table.alertRuleId, table.scoreSnapshotId),
    index("alert_events_user_created_idx").on(table.userId, table.createdAt),
    index("alert_events_telegram_status_sent_idx").on(table.telegramStatus, table.sentAt),
  ]
)

export const usersRelations = relations(users, ({ many, one }) => ({
  watchlistItems: many(watchlistItems),
  alertRules: many(alertRules),
  alertEvents: many(alertEvents),
  telegramDeliveryState: one(telegramDeliveryState),
}))

export const assetsRelations = relations(assets, ({ many }) => ({
  watchlistItems: many(watchlistItems),
  alertRules: many(alertRules),
  scoreSnapshots: many(scoreSnapshots),
}))

export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
  user: one(users, {
    fields: [watchlistItems.userId],
    references: [users.id],
  }),
  asset: one(assets, {
    fields: [watchlistItems.assetId],
    references: [assets.id],
  }),
}))

export const alertRulesRelations = relations(alertRules, ({ one, many }) => ({
  user: one(users, {
    fields: [alertRules.userId],
    references: [users.id],
  }),
  asset: one(assets, {
    fields: [alertRules.assetId],
    references: [assets.id],
  }),
  alertEvents: many(alertEvents),
}))

export const alertEventsRelations = relations(alertEvents, ({ one }) => ({
  alertRule: one(alertRules, {
    fields: [alertEvents.alertRuleId],
    references: [alertRules.id],
  }),
  user: one(users, {
    fields: [alertEvents.userId],
    references: [users.id],
  }),
  asset: one(assets, {
    fields: [alertEvents.assetId],
    references: [assets.id],
  }),
  scoreSnapshot: one(scoreSnapshots, {
    fields: [alertEvents.scoreSnapshotId],
    references: [scoreSnapshots.id],
  }),
}))

export const telegramDeliveryStateRelations = relations(telegramDeliveryState, ({ one }) => ({
  user: one(users, {
    fields: [telegramDeliveryState.userId],
    references: [users.id],
  }),
}))

export const scoreSnapshotsRelations = relations(scoreSnapshots, ({ one, many }) => ({
  asset: one(assets, {
    fields: [scoreSnapshots.assetId],
    references: [assets.id],
  }),
  alertEvents: many(alertEvents),
}))

export type User = typeof users.$inferSelect
export type AssetCatalog = typeof assetCatalog.$inferSelect
export type Asset = typeof assets.$inferSelect
export type WatchlistItem = typeof watchlistItems.$inferSelect
export type AlertRule = typeof alertRules.$inferSelect
export type AlertEvent = typeof alertEvents.$inferSelect
export type TelegramDeliveryState = typeof telegramDeliveryState.$inferSelect
export type ScoreSnapshot = typeof scoreSnapshots.$inferSelect
export type ProviderCache = typeof providerCache.$inferSelect
export type ScheduledJobRun = typeof scheduledJobRuns.$inferSelect

export type ScheduledJobName =
  | "score-daily"
  | "score-weekly"
  | "evaluate-alerts"
  | "sync-asset-catalog"
export type ScheduledJobTriggeredBy = "cron-job.org" | "manual" | "admin"
export type ScheduledJobStatus = "running" | "success" | "partial_failure" | "failed"

export type TelegramDeliveryStatus =
  | "connected"
  | "blocked"
  | "invalid_chat"
  | "disconnected"
  | "send_failed"

export type AlertTelegramStatus = "sent" | "failed" | "skipped_rate_limited"
