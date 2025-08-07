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
  stripeCustomerId: varchar("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  inviteCode: varchar("invite_code").unique().notNull(),
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
