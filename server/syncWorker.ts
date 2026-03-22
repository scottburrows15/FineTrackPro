// Background worker for Open Banking transaction synchronization
import cron from 'node-cron';
import { db } from './db';
import { teams, obTokens, paymentIntents, fines } from '../shared/schema';
import { eq, and, lt } from 'drizzle-orm';
import { checkTimeLimitOverride } from './paymentStrategy';
import { MockOpenBankingProvider, decrypt, extractSearchTerms, reconcileTransaction } from './openBanking';

console.log('🔄 Starting Open Banking sync worker...');

// Sync transactions every 5 minutes during business hours (9 AM - 6 PM, Mon-Fri)
cron.schedule('*/5 9-18 * * 1-5', async () => {
  console.log('⏰ Running scheduled Open Banking sync...');
  await syncAllTeams();
});

// Cleanup expired payment intents every hour
cron.schedule('0 * * * *', async () => {
  console.log('🧹 Cleaning up expired payment intents...');
  await cleanupExpiredIntents();
});

// Time Limit Override: check every hour for fines past grace period
cron.schedule('0 * * * *', async () => {
  try {
    const timeLimitTeams = await db.select().from(teams)
      .where(eq(teams.paymentMode, 'time_limit'));

    for (const team of timeLimitTeams) {
      const graceDays = team.gracePeriodDays ?? 14;
      const unpaidFines = await db.select().from(fines)
        .where(and(eq(fines.isPaid, false)));

      let marked = 0;
      for (const fine of unpaidFines) {
        if (fine.createdAt && checkTimeLimitOverride(new Date(fine.createdAt), graceDays)) {
          if (fine.paymentStatus === 'unpaid') {
            marked++;
          }
        }
      }
      if (marked > 0) {
        console.log(`⏰ Time limit: ${marked} fines now payable for team ${team.id}`);
      }
    }
  } catch (error) {
    console.error('Error in time limit override check:', error);
  }
});

// Monthly Sweep: run at midnight on configured day
cron.schedule('0 0 * * *', async () => {
  try {
    const today = new Date().getDate();
    const sweepTeams = await db.select().from(teams)
      .where(eq(teams.paymentMode, 'monthly_sweep'));

    for (const team of sweepTeams) {
      const sweepDay = team.monthlySweepDay ?? 1;
      if (today === sweepDay) {
        console.log(`💸 Monthly sweep triggered for team ${team.id}`);
      }
    }
  } catch (error) {
    console.error('Error in monthly sweep check:', error);
  }
});

// Main sync function for all teams with Open Banking connections
async function syncAllTeams(): Promise<void> {
  try {
    // Get all teams with active Open Banking connections
    const teamsWithOB = await db
      .select({
        team: teams,
        tokens: obTokens
      })
      .from(teams)
      .innerJoin(obTokens, eq(teams.id, obTokens.teamId))
      .where(and(
        // Only teams with valid provider and account
        // Token not expired or no expiry set
        or(
          isNull(obTokens.expiresAt),
          gt(obTokens.expiresAt, new Date())
        )
      ));

    console.log(`Found ${teamsWithOB.length} teams with Open Banking connections`);

    for (const { team, tokens } of teamsWithOB) {
      try {
        await syncTeamTransactions(team, tokens);
      } catch (error) {
        console.error(`Error syncing team ${team.id}:`, error);
        // Continue with other teams even if one fails
      }
    }

  } catch (error) {
    console.error('Error in syncAllTeams:', error);
  }
}

// Sync transactions for a specific team
async function syncTeamTransactions(team: any, tokens: any): Promise<void> {
  try {
    console.log(`Syncing transactions for team ${team.name} (${team.id})`);

    // Decrypt access token
    const accessToken = decrypt(tokens.accessTokenEncrypted);

    // Initialize provider
    const obProvider = new MockOpenBankingProvider(team.obProvider);

    // Fetch transactions from the last 7 days
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const newTransactions = await obProvider.getTransactions(accessToken, team.obAccountId, fromDate);

    let processedCount = 0;
    let reconciledCount = 0;

    // Process each transaction
    for (const txData of newTransactions) {
      try {
        // Check if transaction already exists (idempotent)
        const existing = await db.query.transactions.findFirst({
          where: and(
            eq(transactions.teamId, team.id),
            eq(transactions.providerTxnId, txData.transactionId)
          )
        });

        if (existing) {
          continue; // Skip already processed transactions
        }

        // Create new transaction record
        const [newTx] = await db.insert(transactions).values({
          teamId: team.id,
          providerTxnId: txData.transactionId,
          amountMinor: txData.amount,
          currency: txData.currency,
          direction: txData.direction,
          bookingDate: new Date(txData.bookingDate),
          valueDate: txData.valueDate ? new Date(txData.valueDate) : null,
          narrative: txData.narrative,
          payerName: txData.payerName,
          payerAccountIdentifier: txData.payerAccount,
          rawData: txData,
          indexedTerms: extractSearchTerms(txData.narrative, txData.payerName)
        }).returning();

        processedCount++;

        // Only reconcile credit transactions (incoming payments)
        if (txData.direction === 'credit') {
          await reconcileTransaction(newTx, team.id);
          reconciledCount++;
        }

      } catch (txError) {
        console.error(`Error processing transaction ${txData.transactionId}:`, txError);
        // Continue with other transactions
      }
    }

    console.log(`Team ${team.name}: Processed ${processedCount} transactions, reconciled ${reconciledCount}`);

    // Log sync activity if any transactions were processed
    if (processedCount > 0) {
      await db.insert(auditLog).values({
        actorId: null, // System action
        teamId: team.id,
        action: 'ob_sync_automated',
        entityType: 'team',
        entityId: team.id,
        metadata: {
          transactionsProcessed: processedCount,
          transactionsReconciled: reconciledCount,
          fromDate,
          triggeredBy: 'cron_worker'
        }
      });
    }

  } catch (error) {
    console.error(`Error syncing team ${team.id}:`, error);
    
    // Log sync failure
    await db.insert(auditLog).values({
      actorId: null,
      teamId: team.id,
      action: 'ob_sync_failed',
      entityType: 'team',
      entityId: team.id,
      metadata: {
        error: error.message,
        triggeredBy: 'cron_worker'
      }
    });
  }
}

// Cleanup expired payment intents
async function cleanupExpiredIntents(): Promise<void> {
  try {
    console.log('Checking for expired payment intents...');

    // Find expired payment intents that are still pending
    const expiredIntents = await db
      .select()
      .from(paymentIntents)
      .where(and(
        eq(paymentIntents.status, 'pending'),
        lt(paymentIntents.expiresAt, new Date())
      ));

    if (expiredIntents.length === 0) {
      console.log('No expired payment intents found');
      return;
    }

    console.log(`Found ${expiredIntents.length} expired payment intents`);

    // Update expired intents
    for (const intent of expiredIntents) {
      await db
        .update(paymentIntents)
        .set({ status: 'expired' })
        .where(eq(paymentIntents.id, intent.id));

      // Log the expiration
      await db.insert(auditLog).values({
        actorId: null, // System action
        teamId: intent.teamId,
        action: 'payment_intent_expired',
        entityType: 'payment_intent',
        entityId: intent.id,
        paymentIntentId: intent.id,
        metadata: {
          reference: intent.reference,
          totalMinor: intent.totalMinor,
          expiresAt: intent.expiresAt?.toISOString(),
          triggeredBy: 'cleanup_worker'
        }
      });
    }

    console.log(`Marked ${expiredIntents.length} payment intents as expired`);

  } catch (error) {
    console.error('Error cleaning up expired payment intents:', error);
  }
}

// Manual trigger functions for testing/admin use
export async function triggerManualSync(teamId?: string): Promise<void> {
  console.log('🔄 Manual sync triggered...');
  
  if (teamId) {
    // Sync specific team
    const teamData = await db
      .select({
        team: teams,
        tokens: obTokens
      })
      .from(teams)
      .innerJoin(obTokens, eq(teams.id, obTokens.teamId))
      .where(eq(teams.id, teamId))
      .limit(1);

    if (teamData.length > 0) {
      await syncTeamTransactions(teamData[0].team, teamData[0].tokens);
    } else {
      throw new Error(`No Open Banking connection found for team ${teamId}`);
    }
  } else {
    // Sync all teams
    await syncAllTeams();
  }
}

export async function triggerManualCleanup(): Promise<void> {
  console.log('🧹 Manual cleanup triggered...');
  await cleanupExpiredIntents();
}

// Health check function
export function getWorkerStatus() {
  return {
    running: true,
    syncSchedule: '*/5 9-18 * * 1-5', // Every 5 minutes, business hours, weekdays
    cleanupSchedule: '0 * * * *', // Every hour
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    nextSyncTime: cron.getTasks().size > 0 ? 'Scheduled' : 'Not scheduled'
  };
}

console.log('✅ Open Banking sync worker initialized');

// Import required modules that were missing
import { transactions, auditLog } from '../shared/schema';
import { or, isNull, gt } from 'drizzle-orm';