import {
  users,
  teams,
  fineCategories,
  fineSubcategories,
  fines,
  notifications,
  auditLog,
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
  type UserWithTeam,
  type TeamStats,
  type PlayerStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, count, sql } from "drizzle-orm";

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
  createFineCategory(category: InsertFineCategory): Promise<FineCategory>;
  deleteCategory(id: string): Promise<void>;
  
  // Fine subcategory operations
  getCategorySubcategories(categoryId: string): Promise<FineSubcategory[]>;
  createFineSubcategory(subcategory: InsertFineSubcategory): Promise<FineSubcategory>;
  deleteSubcategory(id: string): Promise<void>;
  
  // Fine operations
  getUserFines(userId: string): Promise<FineWithDetails[]>;
  getTeamFines(teamId: string): Promise<FineWithDetails[]>;
  createFine(fine: InsertFine): Promise<Fine>;
  updateFine(id: string, updates: Partial<Fine>): Promise<Fine>;
  
  // Statistics
  getPlayerStats(userId: string): Promise<PlayerStats>;
  getTeamStats(teamId: string): Promise<TeamStats>;
  
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

  async createFineCategory(categoryData: InsertFineCategory): Promise<FineCategory> {
    const [category] = await db.insert(fineCategories).values(categoryData).returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    // First delete all subcategories in this category
    await db.delete(fineSubcategories).where(eq(fineSubcategories.categoryId, id));
    // Then delete the category
    await db.delete(fineCategories).where(eq(fineCategories.id, id));
  }

  async getCategorySubcategories(categoryId: string): Promise<FineSubcategory[]> {
    return await db
      .select()
      .from(fineSubcategories)
      .where(eq(fineSubcategories.categoryId, categoryId))
      .orderBy(fineSubcategories.sortOrder);
  }

  async createFineSubcategory(subcategoryData: InsertFineSubcategory): Promise<FineSubcategory> {
    const [subcategory] = await db.insert(fineSubcategories).values(subcategoryData).returning();
    return subcategory;
  }

  async deleteSubcategory(id: string): Promise<void> {
    await db.delete(fineSubcategories).where(eq(fineSubcategories.id, id));
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
    // This is a complex query that needs proper joins - simplified for now
    const result = await db
      .select()
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id))
      .where(eq(users.teamId, teamId))
      .orderBy(desc(fines.createdAt));

    // Return simplified result for now
    return [];
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

    return {
      totalPlayers: Number(memberCount.count) || 0,
      outstandingFines: (outstandingResult.total || "0.00").toString(),
      monthlyCollection: "425.00", // Simplified
      weeklyFines: 12, // Simplified
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
}

export const storage = new DatabaseStorage();
