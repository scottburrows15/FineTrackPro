import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("player"), // 'player' or 'admin'
  teamId: varchar("team_id").references(() => teams.id),
  position: varchar("position"), // e.g., "Striker", "Midfielder"
  nickname: varchar("nickname"), // Team-specific nickname
  stripeCustomerId: varchar("stripe_customer_id"),
  preferredPaymentDate: integer("preferred_payment_date"), // Day of month (1-28) for direct debit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  sport: varchar("sport").notNull().default("Football"), // e.g., "Football", "Rugby", "Netball", "Hockey"
  inviteCode: varchar("invite_code").unique().notNull(),
  currency: varchar("currency", { length: 3 }).default("GBP"),
  obProvider: varchar("ob_provider", { length: 50 }),
  obAccountId: varchar("ob_account_id", { length: 255 }),
  obConsentId: varchar("ob_consent_id", { length: 255 }),
  bankAccountName: varchar("bank_account_name", { length: 255 }),
  bankSortCode: varchar("bank_sort_code", { length: 10 }),
  bankAccountNumber: varchar("bank_account_number", { length: 20 }),
  bankIban: varchar("bank_iban", { length: 50 }),
  referencePrefix: varchar("reference_prefix", { length: 10 }).default("FINE"),
  // Subscription fields
  currentSubscriptionId: varchar("current_subscription_id"),
  isTrialActive: boolean("is_trial_active").default(false),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Fine categories table
export const fineCategories = pgTable("fine_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  name: varchar("name").notNull(),
  color: varchar("color").notNull().default("#1E40AF"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fine subcategories table
export const fineSubcategories = pgTable("fine_subcategories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => fineCategories.id).notNull(),
  name: varchar("name").notNull(),
  defaultAmount: decimal("default_amount", { precision: 10, scale: 2 }).notNull(),
  icon: varchar("icon").notNull().default("fas fa-gavel"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fines table
export const fines = pgTable("fines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").references(() => users.id).notNull(),
  subcategoryId: varchar("subcategory_id").references(() => fineSubcategories.id).notNull(),
  issuedBy: varchar("issued_by").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isPaid: boolean("is_paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
  paymentIntentId: varchar("payment_intent_id"),
  paymentMethod: varchar("payment_method").default("manual"), // For manual payments
  paymentReference: varchar("payment_reference", { length: 50 }),
  transactionId: varchar("transaction_id"), // Bank ref, PayPal ID, etc.
  paymentNotes: text("payment_notes"), // Admin notes about payment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit log table
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // 'fine', 'user', 'team', etc.
  entityId: varchar("entity_id").notNull(),
  action: varchar("action").notNull(), // 'create', 'update', 'delete', 'pay'
  userId: varchar("user_id").references(() => users.id),
  changes: jsonb("changes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin notification preferences table
export const adminPreferences = pgTable("admin_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  emailAlertsEnabled: boolean("email_alerts_enabled").notNull().default(true),
  pushNotificationsEnabled: boolean("push_notifications_enabled").notNull().default(true),
  summaryNotificationsEnabled: boolean("summary_notifications_enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // 'fine_issued', 'fine_paid', 'reminder'
  isRead: boolean("is_read").notNull().default(false),
  relatedEntityId: varchar("related_entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  finesIssued: many(fines, { relationName: "finesIssued" }),
  finesReceived: many(fines, { relationName: "finesReceived" }),
  notifications: many(notifications),
  auditLogs: many(auditLog),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(users),
  categories: many(fineCategories),
  subscriptions: many(subscriptions),
}));

export const fineCategoriesRelations = relations(fineCategories, ({ one, many }) => ({
  team: one(teams, {
    fields: [fineCategories.teamId],
    references: [teams.id],
  }),
  subcategories: many(fineSubcategories),
}));

export const fineSubcategoriesRelations = relations(fineSubcategories, ({ one, many }) => ({
  category: one(fineCategories, {
    fields: [fineSubcategories.categoryId],
    references: [fineCategories.id],
  }),
  fines: many(fines),
}));

export const finesRelations = relations(fines, ({ one }) => ({
  player: one(users, {
    fields: [fines.playerId],
    references: [users.id],
    relationName: "finesReceived",
  }),
  issuedByUser: one(users, {
    fields: [fines.issuedBy],
    references: [users.id],
    relationName: "finesIssued",
  }),
  subcategory: one(fineSubcategories, {
    fields: [fines.subcategoryId],
    references: [fineSubcategories.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));


// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFineCategorySchema = createInsertSchema(fineCategories).omit({
  id: true,
  createdAt: true,
});

export const insertFineSubcategorySchema = createInsertSchema(fineSubcategories).omit({
  id: true,
  createdAt: true,
});

export const insertFineSchema = createInsertSchema(fines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true,
});

export const insertAdminPreferencesSchema = createInsertSchema(adminPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type FineCategory = typeof fineCategories.$inferSelect;
export type InsertFineCategory = z.infer<typeof insertFineCategorySchema>;
export type FineSubcategory = typeof fineSubcategories.$inferSelect;
export type InsertFineSubcategory = z.infer<typeof insertFineSubcategorySchema>;
export type Fine = typeof fines.$inferSelect;
export type InsertFine = z.infer<typeof insertFineSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AdminPreferences = typeof adminPreferences.$inferSelect;
export type InsertAdminPreferences = z.infer<typeof insertAdminPreferencesSchema>;

// Extended types with relations
export type UserWithTeam = User & {
  team?: Team;
};

export type FineWithDetails = Fine & {
  player: User;
  issuedByUser: User;
  subcategory: FineSubcategory & {
    category: FineCategory;
  };
};

export type TeamStats = {
  totalPlayers: number;
  outstandingFines: string;
  monthlyCollection: string;
  weeklyFines: number;
};

export type PlayerStats = {
  totalUnpaid: string;
  totalPaid: string;
  monthlyFines: number;
  leaguePosition: number;
};

// Payment system tables for Open Banking integration
export const paymentIntents = pgTable("payment_intents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  playerId: varchar("player_id").references(() => users.id).notNull(),
  totalMinor: integer("total_minor").notNull(),
  currency: varchar("currency", { length: 3 }).default("GBP").notNull(),
  reference: varchar("reference", { length: 50 }).unique().notNull(),
  status: varchar("status", { length: 30 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  bankDetailsSnapshot: jsonb("bank_details_snapshot"),
  matchedTransactionId: varchar("matched_transaction_id"),
});

export const paymentIntentFines = pgTable("payment_intent_fines", {
  paymentIntentId: varchar("payment_intent_id").references(() => paymentIntents.id).notNull(),
  fineId: varchar("fine_id").references(() => fines.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.paymentIntentId, table.fineId] }),
}));

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  providerTxnId: varchar("provider_txn_id", { length: 255 }).notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: varchar("currency", { length: 3 }).default("GBP").notNull(),
  direction: varchar("direction", { length: 10 }).default("credit").notNull(),
  bookingDate: text("booking_date").notNull(),
  valueDate: text("value_date"),
  narrative: text("narrative"),
  payerName: varchar("payer_name", { length: 255 }),
  payerAccountIdentifier: varchar("payer_account_identifier", { length: 100 }),
  rawData: jsonb("raw_data"),
  indexedTerms: text("indexed_terms").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reconciliationMatches = pgTable("reconciliation_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => transactions.id).notNull(),
  paymentIntentId: varchar("payment_intent_id").references(() => paymentIntents.id).notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
  matchReason: varchar("match_reason", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const obTokens = pgTable("ob_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription management tables
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // 'starter', 'club', 'pro', 'enterprise'
  displayName: varchar("display_name").notNull(), // 'Starter', 'Club', 'Pro', 'Enterprise'
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  maxTeamMembers: integer("max_team_members"), // null = unlimited
  maxCategories: integer("max_categories"), // null = unlimited
  features: jsonb("features").notNull(), // Array of feature flags
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  planId: varchar("plan_id").references(() => subscriptionPlans.id).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  status: varchar("status").notNull().default("active"), // 'active', 'canceled', 'past_due', 'unpaid'
  billingInterval: varchar("billing_interval").notNull().default("monthly"), // 'monthly', 'yearly'
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  canceledAt: timestamp("canceled_at"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription relations
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  team: one(teams, {
    fields: [subscriptions.teamId],
    references: [teams.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

// Payment system insert schemas
export const insertPaymentIntentSchema = createInsertSchema(paymentIntents).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Payment system types
export type PaymentIntent = typeof paymentIntents.$inferSelect;
export type InsertPaymentIntent = z.infer<typeof insertPaymentIntentSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type ReconciliationMatch = typeof reconciliationMatches.$inferSelect;
export type OBToken = typeof obTokens.$inferSelect;

// Subscription types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
