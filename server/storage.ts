import {
  users,
  teams,
  fineCategories,
  fineSubcategories,
  fines,
  notifications,
  auditLog,
  adminPreferences,
  teamMemberships,
  pushSubscriptions,
  type User,
  type UpsertUser,
  type Team,
  type InsertTeam,
  type FineCategory,
  type InsertFineCategory,
  type FineSubcategory,
  type InsertFineSubcategory,
  type Fine,
  type InsertFine,
  type FineWithDetails,
  type Notification,
  type InsertNotification,
  type InsertAuditLog,
  type AdminPreferences,
  type InsertAdminPreferences,
  type UserWithTeam,
  type TeamStats,
  type PlayerStats,
  type TeamMembership,
  type InsertTeamMembership,
  type TeamMembershipWithTeam,
  type TeamWallet,
  type InsertTeamWallet,
  type Payout,
  type InsertPayout,
  type GcBillingRequest,
  type InsertGcBillingRequest,
  type PaymentHistory,
  type InsertPaymentHistory,
  type PushSubscription,
  teamWallets,
  payouts,
  gcBillingRequests,
  paymentHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, count, sql, gte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createMobileUser(data: { email: string; passwordHash: string; firstName: string }): Promise<User>;
  updateUserPasswordHash(userId: string, passwordHash: string): Promise<void>;
  getUserWithTeam(id: string): Promise<UserWithTeam | undefined>;
  
  // Team operations
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByInviteCode(code: string): Promise<Team | undefined>;
  getTeamByGoCardlessState(state: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  generateInviteCode(): string;
  
  // Fine category operations
  getTeamCategories(teamId: string): Promise<FineCategory[]>;
  getTeamCategoriesWithCounts(teamId: string): Promise<(FineCategory & { subcategoryCount: number })[]>;
  getCategory(id: string): Promise<FineCategory | undefined>;
  createFineCategory(category: InsertFineCategory): Promise<FineCategory>;
  updateCategory(id: string, updates: Partial<FineCategory>): Promise<FineCategory>;
  deleteCategory(id: string): Promise<void>;
  reorderCategories(categoryIds: string[]): Promise<void>;
  
  // Fine subcategory operations
  getCategorySubcategories(categoryId: string): Promise<FineSubcategory[]>;
  getSubcategory(id: string): Promise<FineSubcategory | undefined>;
  createFineSubcategory(subcategory: InsertFineSubcategory): Promise<FineSubcategory>;
  updateSubcategory(id: string, updates: Partial<FineSubcategory>): Promise<FineSubcategory>;
  deleteSubcategory(id: string): Promise<void>;
  reorderSubcategories(categoryId: string, subcategoryIds: string[]): Promise<void>;
  
  // Fine operations
  getUserFines(userId: string): Promise<FineWithDetails[]>;
  getTeamFines(teamId: string): Promise<FineWithDetails[]>;
  getFine(id: string): Promise<Fine | undefined>;
  getFineById(id: string): Promise<Fine | undefined>;
  getFinesByPaymentIntentId(paymentIntentId: string): Promise<Fine[]>;
  getFinesByBillingRequestId(billingRequestId: string): Promise<Fine[]>;
  assignBillingRequestIdToFines(fineIds: string[], billingRequestId: string): Promise<void>;
  resetPendingByBillingRequest(billingRequestId: string): Promise<number>;
  getPendingPaymentFinesTotal(teamId: string): Promise<number>;
  getPaidFinesNetTotal(teamId: string): Promise<number>;
  createFine(fine: InsertFine): Promise<Fine>;
  updateFine(id: string, updates: Partial<Fine>): Promise<Fine>;
  deleteFine(id: string): Promise<void>;
  
  // Statistics
  getPlayerStats(userId: string): Promise<PlayerStats>;
  getTeamStats(teamId: string): Promise<TeamStats>;
  getTeamAnalytics(teamId: string): Promise<any>;
  
  // Payment operations
  recordManualPayment(fineId: string, paymentData: any): Promise<Fine>;
  
  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  getTeamNotifications(teamId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markNotificationUnread(id: string): Promise<void>;
  markAllNotificationsRead(userId: string, notificationTypes?: string[]): Promise<void>;
  
  // Audit log
  createAuditLog(log: InsertAuditLog): Promise<void>;

  // Admin operations
  getUnpaidFines(teamId: string): Promise<FineWithDetails[]>;
  getTeamMembers(teamId: string): Promise<User[]>;
  getTeamAdmins(teamId: string): Promise<User[]>;
  addPlayerToTeam(userId: string, teamId: string): Promise<User>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team>;
  
  // Payment history operations
  createPaymentHistory(data: InsertPaymentHistory): Promise<PaymentHistory>;
  getPaymentHistory(teamId: string): Promise<PaymentHistory[]>;
  getPlayerPaymentHistory(playerId: string): Promise<PaymentHistory[]>;
  
  // Admin preferences
  getAdminPreferences(userId: string): Promise<AdminPreferences | undefined>;
  upsertAdminPreferences(preferences: InsertAdminPreferences): Promise<AdminPreferences>;
  
  // Team membership operations
  getUserTeamMemberships(userId: string): Promise<TeamMembershipWithTeam[]>;
  getTeamMembership(userId: string, teamId: string): Promise<TeamMembership | undefined>;
  getActiveTeamMembership(userId: string): Promise<TeamMembershipWithTeam | undefined>;
  createTeamMembership(membership: InsertTeamMembership): Promise<TeamMembership>;
  updateTeamMembership(id: string, updates: Partial<TeamMembership>): Promise<TeamMembership>;
  setActiveTeamMembership(userId: string, teamId: string, activeView?: string): Promise<TeamMembership>;
  deleteTeamMembership(id: string): Promise<void>;
  
  // Team Wallet operations
  getTeamWallet(teamId: string): Promise<TeamWallet | undefined>;
  createTeamWallet(teamId: string): Promise<TeamWallet>;
  getOrCreateTeamWallet(teamId: string): Promise<TeamWallet>;
  creditWallet(teamId: string, amountPence: number): Promise<TeamWallet>;
  debitWallet(teamId: string, amountPence: number): Promise<TeamWallet>;
  addPendingBalance(teamId: string, amountPence: number): Promise<TeamWallet>;
  confirmPendingBalance(teamId: string, amountPence: number): Promise<TeamWallet>;
  
  // Payout operations
  createPayout(payout: InsertPayout): Promise<Payout>;
  getPayout(id: string): Promise<Payout | undefined>;
  getTeamPayouts(teamId: string): Promise<Payout[]>;
  updatePayout(id: string, updates: Partial<Payout>): Promise<Payout>;
  
  // GoCardless Billing Request operations
  createGcBillingRequest(request: InsertGcBillingRequest): Promise<GcBillingRequest>;
  getGcBillingRequest(id: string): Promise<GcBillingRequest | undefined>;
  getGcBillingRequestByBillingRequestId(billingRequestId: string): Promise<GcBillingRequest | undefined>;
  getGcBillingRequestByFlowId(flowId: string): Promise<GcBillingRequest | undefined>;
  getGcBillingRequestByPaymentId(paymentId: string): Promise<GcBillingRequest | undefined>;
  updateGcBillingRequest(id: string, updates: Partial<GcBillingRequest>): Promise<GcBillingRequest>;
  getPlayerGcBillingRequests(playerId: string): Promise<GcBillingRequest[]>;
  getPendingGcBillingRequests(teamId: string): Promise<GcBillingRequest[]>;

  // Push subscription operations
  savePushSubscription(userId: string, subscription: { endpoint: string; p256dh: string; auth: string }): Promise<PushSubscription>;
  removePushSubscription(endpoint: string): Promise<void>;
  getPushSubscriptionsForUser(userId: string): Promise<PushSubscription[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createMobileUser(data: { email: string; passwordHash: string; firstName: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        role: 'player',
      })
      .returning();
    return user;
  }

  async updateUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithTeam(id: string): Promise<UserWithTeam | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .leftJoin(teams, eq(users.teamId, teams.id))
      .where(eq(users.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.users,
      team: result.teams || undefined,
    };
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamByInviteCode(code: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.inviteCode, code));
    return team;
  }

  async getTeamByGoCardlessState(state: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.goCardlessOAuthState, state));
    return team;
  }

  async getTeamById(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(teamData).returning();
    return team;
  }

  generateInviteCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  async getTeamCategories(teamId: string): Promise<FineCategory[]> {
    return await db
      .select()
      .from(fineCategories)
      .where(eq(fineCategories.teamId, teamId))
      .orderBy(fineCategories.sortOrder);
  }

  async getTeamCategoriesWithCounts(teamId: string): Promise<(FineCategory & { subcategoryCount: number })[]> {
    const result = await db
      .select({
        id: fineCategories.id,
        name: fineCategories.name,
        color: fineCategories.color,
        teamId: fineCategories.teamId,
        sortOrder: fineCategories.sortOrder,
        createdAt: fineCategories.createdAt,
        subcategoryCount: count(fineSubcategories.id),
      })
      .from(fineCategories)
      .leftJoin(fineSubcategories, eq(fineCategories.id, fineSubcategories.categoryId))
      .where(eq(fineCategories.teamId, teamId))
      .groupBy(fineCategories.id, fineCategories.name, fineCategories.color, fineCategories.teamId, fineCategories.sortOrder, fineCategories.createdAt)
      .orderBy(fineCategories.sortOrder);

    return result.map(row => ({
      ...row,
      subcategoryCount: Number(row.subcategoryCount) || 0,
    }));
  }

  async getCategory(id: string): Promise<FineCategory | undefined> {
    const [category] = await db
      .select()
      .from(fineCategories)
      .where(eq(fineCategories.id, id));
    return category;
  }

  async createFineCategory(categoryData: InsertFineCategory): Promise<FineCategory> {
    const [category] = await db.insert(fineCategories).values(categoryData).returning();
    return category;
  }

  async updateCategory(id: string, updates: Partial<FineCategory>): Promise<FineCategory> {
    const [category] = await db
      .update(fineCategories)
      .set(updates)
      .where(eq(fineCategories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    // First delete all subcategories in this category
    await db.delete(fineSubcategories).where(eq(fineSubcategories.categoryId, id));
    // Then delete the category
    await db.delete(fineCategories).where(eq(fineCategories.id, id));
  }

  async reorderCategories(categoryIds: string[]): Promise<void> {
    // Update sortOrder for each category based on its position in the array
    for (let i = 0; i < categoryIds.length; i++) {
      await db
        .update(fineCategories)
        .set({ sortOrder: i })
        .where(eq(fineCategories.id, categoryIds[i]));
    }
  }

  async getCategorySubcategories(categoryId: string): Promise<FineSubcategory[]> {
    return await db
      .select()
      .from(fineSubcategories)
      .where(eq(fineSubcategories.categoryId, categoryId))
      .orderBy(fineSubcategories.sortOrder);
  }

  async getSubcategory(id: string): Promise<FineSubcategory | undefined> {
    const [subcategory] = await db
      .select()
      .from(fineSubcategories)
      .where(eq(fineSubcategories.id, id));
    return subcategory;
  }

  async createFineSubcategory(subcategoryData: InsertFineSubcategory): Promise<FineSubcategory> {
    const [subcategory] = await db.insert(fineSubcategories).values(subcategoryData).returning();
    return subcategory;
  }

  async updateSubcategory(id: string, updates: Partial<FineSubcategory>): Promise<FineSubcategory> {
    const [subcategory] = await db
      .update(fineSubcategories)
      .set(updates)
      .where(eq(fineSubcategories.id, id))
      .returning();
    return subcategory;
  }

  async deleteSubcategory(id: string): Promise<void> {
    await db.delete(fineSubcategories).where(eq(fineSubcategories.id, id));
  }

  async reorderSubcategories(categoryId: string, subcategoryIds: string[]): Promise<void> {
    // Update sortOrder for each subcategory based on its position in the array
    for (let i = 0; i < subcategoryIds.length; i++) {
      await db
        .update(fineSubcategories)
        .set({ sortOrder: i })
        .where(eq(fineSubcategories.id, subcategoryIds[i]));
    }
  }

  async getUserFines(userId: string): Promise<FineWithDetails[]> {
    const result = await db
      .select({
        fine: fines,
        player: users,
        subcategory: fineSubcategories,
        category: fineCategories,
        issuedByUser: {
          id: sql`issued_by_user.id`.as('issued_by_id'),
          firstName: sql`issued_by_user.first_name`.as('issued_by_first_name'),
          lastName: sql`issued_by_user.last_name`.as('issued_by_last_name'),
          email: sql`issued_by_user.email`.as('issued_by_email'),
        }
      })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .innerJoin(fineSubcategories, eq(fines.subcategoryId, fineSubcategories.id))
      .innerJoin(fineCategories, eq(fineSubcategories.categoryId, fineCategories.id))
      .innerJoin(sql`users as issued_by_user`, eq(fines.issuedBy, sql`issued_by_user.id`))
      .where(eq(fines.playerId, userId))
      .orderBy(desc(fines.createdAt));

    // Transform the result to match FineWithDetails type
    return result.map(row => ({
      ...row.fine,
      player: row.player,
      issuedByUser: row.issuedByUser as any,
      subcategory: {
        ...row.subcategory,
        category: row.category,
      },
    }));
  }

  async getTeamFines(teamId: string): Promise<FineWithDetails[]> {
    const result = await db
      .select({
        fine: fines,
        player: users,
        subcategory: fineSubcategories,
        category: fineCategories,
        issuedByUser: {
          id: sql`issued_by_user.id`.as('issued_by_id'),
          firstName: sql`issued_by_user.first_name`.as('issued_by_first_name'),
          lastName: sql`issued_by_user.last_name`.as('issued_by_last_name'),
          email: sql`issued_by_user.email`.as('issued_by_email'),
        }
      })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .innerJoin(fineSubcategories, eq(fines.subcategoryId, fineSubcategories.id))
      .innerJoin(fineCategories, eq(fineSubcategories.categoryId, fineCategories.id))
      .innerJoin(sql`users as issued_by_user`, eq(fines.issuedBy, sql`issued_by_user.id`))
      .where(eq(users.teamId, teamId))
      .orderBy(desc(fines.createdAt));

    return result.map(row => ({
      ...row.fine,
      player: row.player,
      issuedByUser: row.issuedByUser as any,
      subcategory: {
        ...row.subcategory,
        category: row.category,
      },
    }));
  }

  async createFine(fineData: InsertFine): Promise<Fine> {
    const [fine] = await db.insert(fines).values(fineData).returning();
    return fine;
  }

  async updateFine(id: string, updates: Partial<Fine>): Promise<Fine> {
    const [fine] = await db
      .update(fines)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fines.id, id))
      .returning();
    return fine;
  }

  async deleteFine(id: string): Promise<void> {
    await db.delete(fines).where(eq(fines.id, id));
  }

  async getFine(id: string): Promise<Fine | undefined> {
    const [fine] = await db
      .select()
      .from(fines)
      .where(eq(fines.id, id))
      .limit(1);
    return fine;
  }

  async getFineById(id: string): Promise<Fine | undefined> {
    const [fine] = await db
      .select()
      .from(fines)
      .where(eq(fines.id, id))
      .limit(1);
    return fine;
  }

  async getFinesByPaymentIntentId(paymentIntentId: string): Promise<Fine[]> {
    return await db
      .select()
      .from(fines)
      .where(eq(fines.paymentIntentId, paymentIntentId));
  }

  async getFinesByBillingRequestId(billingRequestId: string): Promise<Fine[]> {
    return await db
      .select()
      .from(fines)
      .where(eq(fines.gocardlessBillingRequestId, billingRequestId));
  }

  async assignBillingRequestIdToFines(fineIds: string[], billingRequestId: string): Promise<void> {
    await db
      .update(fines)
      .set({
        gocardlessBillingRequestId: billingRequestId,
        paymentStatus: 'pending_payment',
        updatedAt: new Date(),
      })
      .where(inArray(fines.id, fineIds));
  }

  async resetPendingByBillingRequest(billingRequestId: string): Promise<number> {
    const result = await db
      .update(fines)
      .set({
        gocardlessBillingRequestId: null,
        paymentStatus: 'unpaid',
        updatedAt: new Date(),
      })
      .where(eq(fines.gocardlessBillingRequestId, billingRequestId))
      .returning();
    return result.length;
  }

  async getPendingPaymentFinesTotal(teamId: string): Promise<number> {
    const result = await db
      .select({ total: sum(fines.amount) })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .where(and(
        eq(users.teamId, teamId),
        eq(fines.paymentStatus, 'pending_payment')
      ));
    return Math.round(parseFloat(result[0]?.total || '0') * 100);
  }

  async getPaidFinesNetTotal(teamId: string): Promise<number> {
    const result = await db
      .select({ total: sum(paymentHistory.netAmount) })
      .from(paymentHistory)
      .where(and(
        eq(paymentHistory.teamId, teamId),
        eq(paymentHistory.status, 'completed')
      ));
    return Math.round(parseFloat(result[0]?.total || '0') * 100);
  }

  async getPlayerStats(userId: string): Promise<PlayerStats> {
    // Get unpaid fines total
    const [unpaidResult] = await db
      .select({ total: sum(fines.amount) })
      .from(fines)
      .where(and(eq(fines.playerId, userId), eq(fines.isPaid, false)));

    // Get paid fines total
    const [paidResult] = await db
      .select({ total: sum(fines.amount) })
      .from(fines)
      .where(and(eq(fines.playerId, userId), eq(fines.isPaid, true)));

    // Get monthly fines count (simplified)
    const [monthlyResult] = await db
      .select({ count: count() })
      .from(fines)
      .where(eq(fines.playerId, userId));

    // Calculate league position based on team leaderboard
    const user = await this.getUser(userId);
    let leaguePosition = 0;
    
    if (user?.teamId) {
      // Get team leaderboard (same logic as Hall of Shame)
      const leaderboard = await db
        .select({
          playerId: users.id,
          totalAmount: sum(fines.amount),
        })
        .from(fines)
        .innerJoin(users, eq(fines.playerId, users.id))
        .where(eq(users.teamId, user.teamId))
        .groupBy(users.id)
        .orderBy(desc(sum(fines.amount)));
      
      // Find player's position in leaderboard
      const position = leaderboard.findIndex(entry => entry.playerId === userId);
      leaguePosition = position !== -1 ? position + 1 : 0;
    }

    return {
      totalUnpaid: (unpaidResult.total || "0.00").toString(),
      totalPaid: (paidResult.total || "0.00").toString(),
      monthlyFines: Number(monthlyResult.count) || 0,
      leaguePosition,
    };
  }

  async getTeamStats(teamId: string): Promise<TeamStats> {
    // Get team member count
    const [memberCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.teamId, teamId));

    // Get outstanding fines total
    const [outstandingResult] = await db
      .select({ total: sum(fines.amount) })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .where(and(eq(users.teamId, teamId), eq(fines.isPaid, false)));

    // Get monthly collection (paid fines from current month)
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const [monthlyResult] = await db
      .select({ total: sum(fines.amount) })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .where(and(
        eq(users.teamId, teamId), 
        eq(fines.isPaid, true),
        gte(fines.paidAt, startOfMonth)
      ));

    // Get weekly fines count (fines issued in last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const [weeklyResult] = await db
      .select({ count: count() })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .where(and(
        eq(users.teamId, teamId),
        gte(fines.createdAt, oneWeekAgo)
      ));

    return {
      totalPlayers: Number(memberCount.count) || 0,
      outstandingFines: (outstandingResult.total || "0.00").toString(),
      monthlyCollection: (monthlyResult.total || "0.00").toString(),
      weeklyFines: Number(weeklyResult.count) || 0,
    };
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markNotificationUnread(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: false })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string, notificationTypes?: string[]): Promise<void> {
    if (notificationTypes && notificationTypes.length > 0) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          inArray(notifications.type, notificationTypes)
        ));
    } else {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
    }
  }

  async getTeamNotifications(teamId: string): Promise<Notification[]> {
    // Get all users in the team and their notifications
    const teamUsers = await db.select({ id: users.id }).from(users).where(eq(users.teamId, teamId));
    const userIds = teamUsers.map(u => u.id);
    
    if (userIds.length === 0) return [];
    
    return await db
      .select()
      .from(notifications)
      .where(inArray(notifications.userId, userIds))
      .orderBy(desc(notifications.createdAt));
  }

  async createAuditLog(logData: InsertAuditLog): Promise<void> {
    await db.insert(auditLog).values(logData);
  }

  async getAuditLog(teamId: string, page = 1, limit = 50, filter?: 'all' | 'fines' | 'team'): Promise<{
    logs: Array<{
      id: string;
      entityType: string;
      entityId: string;
      action: string;
      userId: string | null;
      changes: any;
      createdAt: Date | null;
      description: string;
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
      } | null;
    }>;
    total: number;
  }> {
    const offset = (page - 1) * limit;

    // Get audit logs with user details for the team
    const teamUserIds = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.teamId, teamId));
    
    const teamUserIdList = teamUserIds.map(u => u.id);
    
    if (teamUserIdList.length === 0) {
      return { logs: [], total: 0 };
    }

    // Define entity types for each filter category
    const finesEntityTypes = ['fine', 'category', 'subcategory'];
    const teamEntityTypes = ['team', 'user', 'team_membership'];
    
    // Actions to exclude (not meaningful for audit trail)
    const excludedActions = ['switch_team', 'update_affiliation'];
    
    // Build the entity type filter based on the filter parameter
    let entityTypeFilter = sql`1=1`;
    if (filter === 'fines') {
      entityTypeFilter = sql`${auditLog.entityType} IN (${sql.join(finesEntityTypes.map(t => sql`${t}`), sql`, `)})`;
    } else if (filter === 'team') {
      entityTypeFilter = sql`${auditLog.entityType} IN (${sql.join(teamEntityTypes.map(t => sql`${t}`), sql`, `)})`;
    } else {
      const allRelevantTypes = [...finesEntityTypes, ...teamEntityTypes];
      entityTypeFilter = sql`${auditLog.entityType} IN (${sql.join(allRelevantTypes.map(t => sql`${t}`), sql`, `)})`;
    }
    
    // Exclude non-meaningful actions
    const actionFilter = sql`${auditLog.action} NOT IN (${sql.join(excludedActions.map(a => sql`${a}`), sql`, `)})`;

    const rawLogs = await db
      .select({
        id: auditLog.id,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        action: auditLog.action,
        userId: auditLog.userId,
        changes: auditLog.changes,
        createdAt: auditLog.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .where(sql`(${auditLog.userId} IN (${sql.join(teamUserIdList.map(id => sql`${id}`), sql`, `)}) OR ${auditLog.userId} IS NULL) AND ${entityTypeFilter} AND ${actionFilter}`)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(sql`(${auditLog.userId} IN (${sql.join(teamUserIdList.map(id => sql`${id}`), sql`, `)}) OR ${auditLog.userId} IS NULL) AND ${entityTypeFilter} AND ${actionFilter}`);

    // Collect all unique IDs that need resolution
    const playerIds = new Set<string>();
    const teamIds = new Set<string>();
    const categoryIds = new Set<string>();
    const subcategoryIds = new Set<string>();
    
    for (const log of rawLogs) {
      const changes = log.changes as any;
      if (changes?.playerId) playerIds.add(changes.playerId);
      if (changes?.teamId) teamIds.add(changes.teamId);
      if (changes?.categoryId) categoryIds.add(changes.categoryId);
      if (changes?.subcategoryId) subcategoryIds.add(changes.subcategoryId);
      if (log.entityType === 'user' && log.entityId) playerIds.add(log.entityId);
      if (log.entityType === 'team' && log.entityId) teamIds.add(log.entityId);
      if (log.entityType === 'category' && log.entityId) categoryIds.add(log.entityId);
      if (log.entityType === 'subcategory' && log.entityId) subcategoryIds.add(log.entityId);
    }

    // Resolve IDs to names in bulk
    const playerNames: Record<string, string> = {};
    const teamNames: Record<string, string> = {};
    const categoryNames: Record<string, string> = {};
    const subcategoryNames: Record<string, string> = {};

    if (playerIds.size > 0) {
      const playerList = await db.select().from(users).where(inArray(users.id, Array.from(playerIds)));
      for (const p of playerList) {
        playerNames[p.id] = p.nickname || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Unknown';
      }
    }

    if (teamIds.size > 0) {
      const teamList = await db.select().from(teams).where(inArray(teams.id, Array.from(teamIds)));
      for (const t of teamList) {
        teamNames[t.id] = t.name;
      }
    }

    if (categoryIds.size > 0) {
      const catList = await db.select().from(fineCategories).where(inArray(fineCategories.id, Array.from(categoryIds)));
      for (const c of catList) {
        categoryNames[c.id] = c.name;
      }
    }

    if (subcategoryIds.size > 0) {
      const subList = await db.select().from(fineSubcategories).where(inArray(fineSubcategories.id, Array.from(subcategoryIds)));
      for (const s of subList) {
        subcategoryNames[s.id] = s.name;
      }
    }

    // Generate human-readable descriptions
    const logs = rawLogs.map(log => {
      const actorName = log.user ? 
        (log.user.firstName && log.user.lastName ? `${log.user.firstName} ${log.user.lastName}` : log.user.email || 'Unknown') 
        : 'System';
      const changes = log.changes as any || {};
      let description = '';

      switch (log.entityType) {
        case 'fine':
          const playerName = changes.playerId ? playerNames[changes.playerId] || 'a player' : 'a player';
          const amount = changes.amount ? `£${changes.amount}` : '';
          if (log.action === 'create') {
            description = `${actorName} issued a fine${amount ? ` of ${amount}` : ''} to ${playerName}`;
          } else if (log.action === 'update') {
            description = `${actorName} updated a fine for ${playerName}${amount ? ` (${amount})` : ''}`;
          } else if (log.action === 'delete') {
            description = `${actorName} deleted a fine${amount ? ` of ${amount}` : ''} for ${playerName}`;
          } else if (log.action === 'payment_recorded') {
            description = `${actorName} recorded payment${amount ? ` of ${amount}` : ''} for ${playerName}`;
          } else {
            description = `${actorName} ${log.action.replace(/_/g, ' ')} fine`;
          }
          break;

        case 'category':
          const catName = categoryNames[log.entityId] || changes.name || 'a category';
          if (log.action === 'create') {
            description = `${actorName} created category "${catName}"`;
          } else if (log.action === 'delete') {
            description = `${actorName} deleted category "${catName}"`;
          } else {
            description = `${actorName} updated category "${catName}"`;
          }
          break;

        case 'subcategory':
          const subName = subcategoryNames[log.entityId] || changes.name || 'a fine type';
          if (log.action === 'create') {
            description = `${actorName} created fine type "${subName}"`;
          } else if (log.action === 'delete') {
            description = `${actorName} deleted fine type "${subName}"`;
          } else {
            description = `${actorName} updated fine type "${subName}"`;
          }
          break;

        case 'team':
          const tName = teamNames[log.entityId] || changes.name || 'the team';
          if (log.action === 'update') {
            const updateDetails: string[] = [];
            if (changes.name) updateDetails.push(`name to "${changes.name}"`);
            if (changes.sport) updateDetails.push(`sport to "${changes.sport}"`);
            description = updateDetails.length > 0 
              ? `${actorName} updated team ${updateDetails.join(' and ')}`
              : `${actorName} updated team settings`;
          } else if (log.action === 'create') {
            description = `${actorName} created team "${tName}"`;
          } else {
            description = `${actorName} ${log.action.replace(/_/g, ' ')} team`;
          }
          break;

        case 'user':
          const targetName = playerNames[log.entityId] || 'a member';
          if (log.action === 'join_team') {
            description = `${targetName} joined the team`;
          } else if (log.action === 'remove_from_team') {
            description = `${actorName} removed ${targetName} from the team`;
          } else if (log.action === 'update_role') {
            description = `${actorName} changed ${targetName}'s role to ${changes.role || 'member'}`;
          } else if (log.action === 'update') {
            const updateParts: string[] = [];
            if (changes.firstName || changes.lastName) updateParts.push('name');
            if (changes.position) updateParts.push('position');
            if (changes.nickname) updateParts.push('nickname');
            description = updateParts.length > 0
              ? `${actorName} updated ${targetName}'s ${updateParts.join(', ')}`
              : `${actorName} updated ${targetName}'s profile`;
          } else if (log.action === 'profile_image_updated') {
            description = `${actorName} updated ${targetName}'s profile image`;
          } else {
            description = `${actorName} ${log.action.replace(/_/g, ' ')} ${targetName}`;
          }
          break;

        case 'team_membership':
          const memberName = changes.userId ? playerNames[changes.userId] || 'a member' : 'a member';
          if (log.action === 'create') {
            description = `${memberName} was added to the team`;
          } else if (log.action === 'delete') {
            description = `${memberName} was removed from the team`;
          } else if (log.action === 'update') {
            description = `${actorName} updated membership for ${memberName}`;
          } else {
            description = `${actorName} ${log.action.replace(/_/g, ' ')} team membership`;
          }
          break;

        default:
          description = `${actorName} ${log.action.replace(/_/g, ' ')} ${log.entityType}`;
      }

      return {
        ...log,
        description,
      };
    });

    return {
      logs,
      total: Number(count) || 0,
    };
  }

  // Admin operations
  async getUnpaidFines(teamId: string): Promise<FineWithDetails[]> {
    const result = await db
      .select({
        fine: fines,
        player: users,
        subcategory: fineSubcategories,
        category: fineCategories,
        issuedByUser: {
          id: sql`issued_by_user.id`.as('issued_by_id'),
          firstName: sql`issued_by_user.first_name`.as('issued_by_first_name'),
          lastName: sql`issued_by_user.last_name`.as('issued_by_last_name'),
          email: sql`issued_by_user.email`.as('issued_by_email'),
        }
      })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .innerJoin(fineSubcategories, eq(fines.subcategoryId, fineSubcategories.id))
      .innerJoin(fineCategories, eq(fineSubcategories.categoryId, fineCategories.id))
      .innerJoin(sql`users as issued_by_user`, eq(fines.issuedBy, sql`issued_by_user.id`))
      .where(and(eq(users.teamId, teamId), eq(fines.isPaid, false)))
      .orderBy(desc(fines.createdAt));

    return result.map(row => ({
      ...row.fine,
      player: row.player,
      issuedByUser: row.issuedByUser as any,
      subcategory: {
        ...row.subcategory,
        category: row.category,
      },
    }));
  }

  async getTeamMembers(teamId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.teamId, teamId))
      .orderBy(users.firstName, users.lastName);
  }

  async getTeamAdmins(teamId: string): Promise<User[]> {
    const memberships = await db
      .select()
      .from(teamMemberships)
      .where(and(
        eq(teamMemberships.teamId, teamId),
        sql`${teamMemberships.role} IN ('admin', 'both')`
      ));
    
    const adminUserIds = memberships.map(m => m.userId);
    if (adminUserIds.length === 0) return [];
    
    return await db
      .select()
      .from(users)
      .where(inArray(users.id, adminUserIds));
  }

  async addPlayerToTeam(userId: string, teamId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ teamId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const [team] = await db
      .update(teams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async getAdminPreferences(userId: string): Promise<AdminPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(adminPreferences)
      .where(eq(adminPreferences.userId, userId));
    return prefs;
  }

  async upsertAdminPreferences(preferencesData: InsertAdminPreferences): Promise<AdminPreferences> {
    const [prefs] = await db
      .insert(adminPreferences)
      .values(preferencesData)
      .onConflictDoUpdate({
        target: adminPreferences.userId,
        set: {
          ...preferencesData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return prefs;
  }

  async getTeamAnalytics(teamId: string): Promise<any> {
    // Get basic fine statistics
    const totalFinesResult = await db
      .select({
        count: sql<number>`cast(count(*) as int)`,
        totalAmount: sql<number>`cast(coalesce(sum(cast(${fines.amount} as decimal)), 0) as decimal)`,
        paidCount: sql<number>`cast(sum(case when ${fines.isPaid} then 1 else 0 end) as int)`,
      })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .where(eq(users.teamId, teamId));

    const basicStats = totalFinesResult[0];
    const totalFines = basicStats?.count || 0;
    const totalRevenue = Number(basicStats?.totalAmount) || 0;
    const paidFines = basicStats?.paidCount || 0;
    const unpaidFines = totalFines - paidFines;
    const paymentRate = totalFines > 0 ? paidFines / totalFines : 0;
    const averageFineAmount = totalFines > 0 ? totalRevenue / totalFines : 0;

    // Get top offenders
    const topOffendersResult = await db
      .select({
        playerId: users.id,
        playerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        fineCount: sql<number>`cast(count(*) as int)`,
        totalAmount: sql<number>`cast(sum(cast(${fines.amount} as decimal)) as decimal)`,
      })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .where(eq(users.teamId, teamId))
      .groupBy(users.id, users.firstName, users.lastName)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const topOffenders = topOffendersResult.map(row => ({
      playerId: row.playerId,
      playerName: row.playerName,
      fineCount: row.fineCount,
      totalAmount: Number(row.totalAmount),
    }));

    // Get category breakdown
    const categoryBreakdownResult = await db
      .select({
        categoryName: fineCategories.name,
        categoryColor: fineCategories.color,
        count: sql<number>`cast(count(*) as int)`,
        amount: sql<number>`cast(sum(cast(${fines.amount} as decimal)) as decimal)`,
      })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .innerJoin(fineSubcategories, eq(fines.subcategoryId, fineSubcategories.id))
      .innerJoin(fineCategories, eq(fineSubcategories.categoryId, fineCategories.id))
      .where(eq(users.teamId, teamId))
      .groupBy(fineCategories.name, fineCategories.color)
      .orderBy(sql`count(*) desc`);

    const categoryBreakdown = categoryBreakdownResult.map(row => ({
      categoryName: row.categoryName,
      categoryColor: row.categoryColor,
      count: row.count,
      amount: Number(row.amount),
    }));

    // Get monthly trends (last 6 months)
    const monthlyTrendsResult = await db
      .select({
        month: sql<string>`to_char(${fines.createdAt}, 'Mon YYYY')`,
        fines: sql<number>`cast(count(*) as int)`,
        revenue: sql<number>`cast(sum(cast(${fines.amount} as decimal)) as decimal)`,
      })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .where(and(
        eq(users.teamId, teamId),
        sql`${fines.createdAt} >= current_date - interval '6 months'`
      ))
      .groupBy(sql`to_char(${fines.createdAt}, 'Mon YYYY')`, sql`date_trunc('month', ${fines.createdAt})`)
      .orderBy(sql`date_trunc('month', ${fines.createdAt})`);

    const monthlyTrends = monthlyTrendsResult.map(row => ({
      month: row.month,
      fines: row.fines,
      revenue: Number(row.revenue),
    }));

    // Get recent activity (last 20 items)
    const recentActivityResult = await db
      .select({
        id: fines.id,
        type: sql<string>`case when ${fines.isPaid} then 'payment_made' else 'fine_issued' end`,
        description: sql<string>`${users.firstName} || ' ' || ${users.lastName} || ' - ' || ${fineSubcategories.name}`,
        amount: sql<number>`cast(${fines.amount} as decimal)`,
        timestamp: fines.createdAt,
      })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .innerJoin(fineSubcategories, eq(fines.subcategoryId, fineSubcategories.id))
      .where(eq(users.teamId, teamId))
      .orderBy(desc(fines.createdAt))
      .limit(20);

    const recentActivity = recentActivityResult.map(row => ({
      id: row.id,
      type: row.type,
      description: row.description,
      amount: Number(row.amount),
      timestamp: row.timestamp ? row.timestamp.toISOString() : new Date().toISOString(),
    }));

    return {
      totalFines,
      totalRevenue,
      paidFines,
      unpaidFines,
      paymentRate,
      averageFineAmount,
      topOffenders,
      categoryBreakdown,
      monthlyTrends,
      recentActivity,
    };
  }

  async recordManualPayment(fineId: string, paymentData: any): Promise<Fine> {
    const [fine] = await db
      .update(fines)
      .set({
        isPaid: true,
        paidAt: paymentData.paymentDate || new Date(),
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId || null,
        paymentNotes: paymentData.notes || null,
        amount: paymentData.amount,
        updatedAt: new Date(),
      })
      .where(eq(fines.id, fineId))
      .returning();

    if (!fine) {
      throw new Error("Fine not found");
    }

    return fine;
  }

  // Team membership operations
  async getUserTeamMemberships(userId: string): Promise<TeamMembershipWithTeam[]> {
    const memberships = await db
      .select({
        membership: teamMemberships,
        team: teams,
      })
      .from(teamMemberships)
      .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
      .where(eq(teamMemberships.userId, userId))
      .orderBy(desc(teamMemberships.isActive), teams.name);

    // Get unread notification counts for each team membership
    const results: TeamMembershipWithTeam[] = [];
    for (const row of memberships) {
      // Count unread notifications for fines in this team
      const [unreadResult] = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
      
      results.push({
        ...row.membership,
        team: row.team,
        unreadCount: Number(unreadResult.count) || 0,
      });
    }
    
    return results;
  }

  async getTeamMembership(userId: string, teamId: string): Promise<TeamMembership | undefined> {
    const [membership] = await db
      .select()
      .from(teamMemberships)
      .where(and(
        eq(teamMemberships.userId, userId),
        eq(teamMemberships.teamId, teamId)
      ));
    return membership;
  }

  async getActiveTeamMembership(userId: string): Promise<TeamMembershipWithTeam | undefined> {
    const [result] = await db
      .select({
        membership: teamMemberships,
        team: teams,
      })
      .from(teamMemberships)
      .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
      .where(and(
        eq(teamMemberships.userId, userId),
        eq(teamMemberships.isActive, true)
      ));
    
    if (!result) return undefined;
    
    return {
      ...result.membership,
      team: result.team,
    };
  }

  async createTeamMembership(membership: InsertTeamMembership): Promise<TeamMembership> {
    const [newMembership] = await db
      .insert(teamMemberships)
      .values(membership)
      .returning();
    return newMembership;
  }

  async updateTeamMembership(id: string, updates: Partial<TeamMembership>): Promise<TeamMembership> {
    const [membership] = await db
      .update(teamMemberships)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teamMemberships.id, id))
      .returning();
    return membership;
  }

  async setActiveTeamMembership(userId: string, teamId: string, activeView?: string): Promise<TeamMembership> {
    // First, deactivate all other memberships for this user
    await db
      .update(teamMemberships)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(teamMemberships.userId, userId));
    
    // Then activate the specified team membership
    const updates: Partial<TeamMembership> = { isActive: true, updatedAt: new Date() };
    if (activeView) {
      updates.activeView = activeView;
    }
    
    const [membership] = await db
      .update(teamMemberships)
      .set(updates)
      .where(and(
        eq(teamMemberships.userId, userId),
        eq(teamMemberships.teamId, teamId)
      ))
      .returning();
    
    // Also update the user's current teamId for backward compatibility
    await db
      .update(users)
      .set({ teamId, updatedAt: new Date() })
      .where(eq(users.id, userId));
    
    return membership;
  }

  async deleteTeamMembership(id: string): Promise<void> {
    await db.delete(teamMemberships).where(eq(teamMemberships.id, id));
  }

  // Team Wallet operations
  async getTeamWallet(teamId: string): Promise<TeamWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(teamWallets)
      .where(eq(teamWallets.teamId, teamId));
    return wallet;
  }

  async createTeamWallet(teamId: string): Promise<TeamWallet> {
    const [wallet] = await db
      .insert(teamWallets)
      .values({ teamId, availableBalance: 0, pendingBalance: 0 })
      .returning();
    return wallet;
  }

  async getOrCreateTeamWallet(teamId: string): Promise<TeamWallet> {
    const existing = await this.getTeamWallet(teamId);
    if (existing) return existing;
    return await this.createTeamWallet(teamId);
  }

  async creditWallet(teamId: string, amountPence: number): Promise<TeamWallet> {
    const wallet = await this.getOrCreateTeamWallet(teamId);
    const [updated] = await db
      .update(teamWallets)
      .set({ 
        availableBalance: wallet.availableBalance + amountPence,
        updatedAt: new Date()
      })
      .where(eq(teamWallets.teamId, teamId))
      .returning();
    return updated;
  }

  async debitWallet(teamId: string, amountPence: number): Promise<TeamWallet> {
    const wallet = await this.getOrCreateTeamWallet(teamId);
    if (wallet.availableBalance < amountPence) {
      throw new Error('Insufficient balance');
    }
    const [updated] = await db
      .update(teamWallets)
      .set({ 
        availableBalance: wallet.availableBalance - amountPence,
        updatedAt: new Date()
      })
      .where(eq(teamWallets.teamId, teamId))
      .returning();
    return updated;
  }

  async addPendingBalance(teamId: string, amountPence: number): Promise<TeamWallet> {
    const wallet = await this.getOrCreateTeamWallet(teamId);
    const [updated] = await db
      .update(teamWallets)
      .set({ 
        pendingBalance: wallet.pendingBalance + amountPence,
        updatedAt: new Date()
      })
      .where(eq(teamWallets.teamId, teamId))
      .returning();
    return updated;
  }

  async confirmPendingBalance(teamId: string, amountPence: number): Promise<TeamWallet> {
    const wallet = await this.getOrCreateTeamWallet(teamId);
    const [updated] = await db
      .update(teamWallets)
      .set({ 
        pendingBalance: Math.max(0, wallet.pendingBalance - amountPence),
        availableBalance: wallet.availableBalance + amountPence,
        updatedAt: new Date()
      })
      .where(eq(teamWallets.teamId, teamId))
      .returning();
    return updated;
  }

  // Payout operations
  async createPayout(payout: InsertPayout): Promise<Payout> {
    const [newPayout] = await db
      .insert(payouts)
      .values(payout)
      .returning();
    return newPayout;
  }

  async getPayout(id: string): Promise<Payout | undefined> {
    const [payout] = await db
      .select()
      .from(payouts)
      .where(eq(payouts.id, id));
    return payout;
  }

  async getTeamPayouts(teamId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.teamId, teamId))
      .orderBy(desc(payouts.createdAt));
  }

  async updatePayout(id: string, updates: Partial<Payout>): Promise<Payout> {
    const [payout] = await db
      .update(payouts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payouts.id, id))
      .returning();
    return payout;
  }

  // GoCardless Billing Request operations
  async createGcBillingRequest(request: InsertGcBillingRequest): Promise<GcBillingRequest> {
    const [gcRequest] = await db
      .insert(gcBillingRequests)
      .values(request)
      .returning();
    return gcRequest;
  }

  async getGcBillingRequest(id: string): Promise<GcBillingRequest | undefined> {
    const [request] = await db
      .select()
      .from(gcBillingRequests)
      .where(eq(gcBillingRequests.id, id));
    return request;
  }

  async getGcBillingRequestByBillingRequestId(billingRequestId: string): Promise<GcBillingRequest | undefined> {
    const [request] = await db
      .select()
      .from(gcBillingRequests)
      .where(eq(gcBillingRequests.billingRequestId, billingRequestId));
    return request;
  }

  async getGcBillingRequestByFlowId(flowId: string): Promise<GcBillingRequest | undefined> {
    const [request] = await db
      .select()
      .from(gcBillingRequests)
      .where(eq(gcBillingRequests.billingRequestFlowId, flowId));
    return request;
  }

  async getGcBillingRequestByPaymentId(paymentId: string): Promise<GcBillingRequest | undefined> {
    const [request] = await db
      .select()
      .from(gcBillingRequests)
      .where(eq(gcBillingRequests.paymentId, paymentId));
    return request;
  }

  async updateGcBillingRequest(id: string, updates: Partial<GcBillingRequest>): Promise<GcBillingRequest> {
    const [request] = await db
      .update(gcBillingRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gcBillingRequests.id, id))
      .returning();
    return request;
  }

  async getPlayerGcBillingRequests(playerId: string): Promise<GcBillingRequest[]> {
    return await db
      .select()
      .from(gcBillingRequests)
      .where(eq(gcBillingRequests.playerId, playerId))
      .orderBy(desc(gcBillingRequests.createdAt));
  }

  async getPendingGcBillingRequests(teamId: string): Promise<GcBillingRequest[]> {
    return await db
      .select()
      .from(gcBillingRequests)
      .where(and(
        eq(gcBillingRequests.teamId, teamId),
        inArray(gcBillingRequests.status, ['pending', 'fulfilling'])
      ))
      .orderBy(desc(gcBillingRequests.createdAt));
  }

  async createPaymentHistory(data: InsertPaymentHistory): Promise<PaymentHistory> {
    const [record] = await db
      .insert(paymentHistory)
      .values(data)
      .returning();
    return record;
  }

  async getPaymentHistory(teamId: string): Promise<PaymentHistory[]> {
    return await db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.teamId, teamId))
      .orderBy(desc(paymentHistory.createdAt));
  }

  async getPlayerPaymentHistory(playerId: string): Promise<PaymentHistory[]> {
    return await db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.playerId, playerId))
      .orderBy(desc(paymentHistory.createdAt));
  }

  async savePushSubscription(userId: string, subscription: { endpoint: string; p256dh: string; auth: string }): Promise<PushSubscription> {
    const [result] = await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      })
      .returning();
    return result;
  }

  async removePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async getPushSubscriptionsForUser(userId: string): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }
}

export const storage = new DatabaseStorage();
