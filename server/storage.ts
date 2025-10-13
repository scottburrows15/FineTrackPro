import {
  users,
  teams,
  fineCategories,
  fineSubcategories,
  fines,
  notifications,
  auditLog,
  adminPreferences,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, count, sql, gte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithTeam(id: string): Promise<UserWithTeam | undefined>;
  
  // Team operations
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByInviteCode(code: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  generateInviteCode(): string;
  
  // Fine category operations
  getTeamCategories(teamId: string): Promise<FineCategory[]>;
  getTeamCategoriesWithCounts(teamId: string): Promise<(FineCategory & { subcategoryCount: number })[]>;
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
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  
  // Audit log
  createAuditLog(log: InsertAuditLog): Promise<void>;

  // Admin operations
  getUnpaidFines(teamId: string): Promise<FineWithDetails[]>;
  getTeamMembers(teamId: string): Promise<User[]>;
  addPlayerToTeam(userId: string, teamId: string): Promise<User>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team>;
  
  // Admin preferences
  getAdminPreferences(userId: string): Promise<AdminPreferences | undefined>;
  upsertAdminPreferences(preferences: InsertAdminPreferences): Promise<AdminPreferences>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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

  async getFineById(id: string): Promise<Fine | undefined> {
    const [fine] = await db
      .select()
      .from(fines)
      .where(eq(fines.id, id))
      .limit(1);
    return fine;
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

    return {
      totalUnpaid: (unpaidResult.total || "0.00").toString(),
      totalPaid: (paidResult.total || "0.00").toString(),
      monthlyFines: Number(monthlyResult.count) || 0,
      leaguePosition: 4, // This would need a more complex query
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

  async createAuditLog(logData: InsertAuditLog): Promise<void> {
    await db.insert(auditLog).values(logData);
  }

  async getAuditLog(teamId: string, page = 1, limit = 50): Promise<{
    logs: Array<{
      id: string;
      entityType: string;
      entityId: string;
      action: string;
      userId: string | null;
      changes: any;
      createdAt: Date | null;
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
    // First, get all user IDs from the team to filter audit logs
    const teamUserIds = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.teamId, teamId));
    
    const teamUserIdList = teamUserIds.map(u => u.id);
    
    if (teamUserIdList.length === 0) {
      return { logs: [], total: 0 };
    }

    const logs = await db
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
      .where(sql`${auditLog.userId} IN (${sql.join(teamUserIdList.map(id => sql`${id}`), sql`, `)}) OR ${auditLog.userId} IS NULL`)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(sql`${auditLog.userId} IN (${sql.join(teamUserIdList.map(id => sql`${id}`), sql`, `)}) OR ${auditLog.userId} IS NULL`);

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
        count: sql<number>`cast(count(*) as int)`,
        amount: sql<number>`cast(sum(cast(${fines.amount} as decimal)) as decimal)`,
      })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .innerJoin(fineSubcategories, eq(fines.subcategoryId, fineSubcategories.id))
      .innerJoin(fineCategories, eq(fineSubcategories.categoryId, fineCategories.id))
      .where(eq(users.teamId, teamId))
      .groupBy(fineCategories.name)
      .orderBy(sql`count(*) desc`);

    const categoryBreakdown = categoryBreakdownResult.map(row => ({
      categoryName: row.categoryName,
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
}

export const storage = new DatabaseStorage();
