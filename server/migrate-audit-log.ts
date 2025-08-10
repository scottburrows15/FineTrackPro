import { db } from "./db";
import { fines, users, auditLog } from "@shared/schema";
import { eq, isNull, isNotNull } from "drizzle-orm";

/**
 * Migrates existing fine data to create audit log entries
 * This creates historical audit entries based on current fine states
 */
export async function migrateExistingFinesToAuditLog(): Promise<void> {
  console.log("Starting audit log migration for existing fines...");

  try {
    // Get all fines with their associated users
    const existingFines = await db
      .select({
        fine: fines,
        player: users,
      })
      .from(fines)
      .innerJoin(users, eq(fines.playerId, users.id));

    console.log(`Found ${existingFines.length} existing fines to migrate`);

    for (const record of existingFines) {
      const { fine, player } = record;

      // Create audit entry for fine creation
      await db.insert(auditLog).values({
        entityType: 'fine',
        entityId: fine.id,
        action: 'create',
        userId: fine.issuedBy,
        changes: {
          playerId: fine.playerId,
          playerName: `${player.firstName || ''} ${player.lastName || ''}`.trim(),
          subcategoryId: fine.subcategoryId,
          amount: fine.amount,
          description: fine.description,
          migratedEntry: true, // Flag to indicate this is a migrated entry
        },
        createdAt: fine.createdAt,
      });

      // If the fine is paid, create audit entry for payment
      if (fine.isPaid && fine.paidAt) {
        await db.insert(auditLog).values({
          entityType: 'fine',
          entityId: fine.id,
          action: fine.paymentMethod === 'admin_deletion' ? 'delete' : 'pay',
          userId: fine.issuedBy, // Use issuer as we don't have payment user info
          changes: {
            isPaid: true,
            paidAt: fine.paidAt,
            paymentMethod: fine.paymentMethod,
            paymentIntentId: fine.paymentIntentId,
            migratedEntry: true,
          },
          createdAt: fine.paidAt,
        });
      }
    }

    // Get all users and create join_team entries for existing team members
    const teamMembers = await db
      .select()
      .from(users)
      .where(isNotNull(users.teamId));

    console.log(`Found ${teamMembers.length} team members to migrate`);

    for (const member of teamMembers) {
      await db.insert(auditLog).values({
        entityType: 'user',
        entityId: member.id,
        action: 'join_team',
        userId: member.id,
        changes: {
          teamId: member.teamId,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          migratedEntry: true,
        },
        createdAt: member.createdAt,
      });
    }

    console.log("Audit log migration completed successfully!");

  } catch (error) {
    console.error("Error during audit log migration:", error);
    throw error;
  }
}