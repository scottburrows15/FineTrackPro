import { storage } from './storage';
import type { Fine, PaymentHistory, InsertPaymentHistory } from '@shared/schema';

interface MarkAsPaidOptions {
  fineIds: string[];
  paymentMethod: 'gocardless' | 'manual' | 'cash' | 'bank_transfer';
  paymentReference?: string;
  totalAmount: number; // In pence
  feeAmount?: number; // In pence
  netAmount?: number; // In pence (credited to team wallet)
  processedBy?: string; // User ID for manual payments
  notes?: string;
  teamId?: string; // Team ID (use this instead of deriving from player)
  playerId?: string; // Player ID (use this instead of deriving from fines)
  skipWalletCredit?: boolean; // Skip wallet credit if already handled elsewhere
}

interface MarkAsPaidResult {
  success: boolean;
  finesUpdated: number;
  paymentHistoryId?: string;
  error?: string;
}

export async function markAsPaid(options: MarkAsPaidOptions): Promise<MarkAsPaidResult> {
  const {
    fineIds,
    paymentMethod,
    paymentReference,
    totalAmount,
    feeAmount = 0,
    netAmount,
    processedBy,
    notes,
    teamId: providedTeamId,
    playerId: providedPlayerId,
    skipWalletCredit = false,
  } = options;

  try {
    if (!fineIds || fineIds.length === 0) {
      return { success: false, finesUpdated: 0, error: 'No fine IDs provided' };
    }

    // Get the fines to validate and get team/player info
    const fines: Fine[] = [];
    let teamId: string | null = providedTeamId || null;
    let playerId: string | null = providedPlayerId || null;

    for (const fineId of fineIds) {
      const fine = await storage.getFine(fineId);
      if (!fine) {
        console.error(`Fine not found: ${fineId}`);
        continue;
      }
      fines.push(fine);
      
      // Get team ID from the first fine's player if not provided
      if (!teamId) {
        const player = await storage.getUser(fine.playerId);
        if (player?.teamId) {
          teamId = player.teamId;
        }
      }
      if (!playerId) {
        playerId = fine.playerId;
      }
    }

    if (fines.length === 0) {
      return { success: false, finesUpdated: 0, error: 'No valid fines found' };
    }

    if (!teamId || !playerId) {
      return { success: false, finesUpdated: 0, error: 'Could not determine team or player' };
    }

    const now = new Date();

    // Update each fine status to paid
    for (const fine of fines) {
      await storage.updateFine(fine.id, {
        isPaid: true,
        paymentStatus: 'paid',
        paidAt: now,
        paymentMethod,
        paymentReference: paymentReference || null,
        updatedAt: now,
      });
      console.log(`Marked fine ${fine.id} as paid via ${paymentMethod}`);
    }

    // Create payment history entry for audit trail
    const calculatedNetAmount = netAmount ?? (totalAmount - feeAmount);
    
    const paymentHistoryData: InsertPaymentHistory = {
      teamId,
      playerId,
      fineIds: fineIds,
      totalAmount: (totalAmount / 100).toFixed(2), // Convert pence to pounds
      feeAmount: (feeAmount / 100).toFixed(2),
      netAmount: (calculatedNetAmount / 100).toFixed(2),
      paymentMethod,
      paymentReference: paymentReference || null,
      status: 'completed',
      processedBy: processedBy || null,
      notes: notes || null,
    };

    const paymentHistory = await storage.createPaymentHistory(paymentHistoryData);
    console.log(`Created payment history entry: ${paymentHistory.id}`);

    // Credit team wallet with net amount (unless already handled elsewhere)
    if (!skipWalletCredit && calculatedNetAmount > 0) {
      await storage.creditWallet(teamId, calculatedNetAmount);
      console.log(`Credited team ${teamId} wallet with ${calculatedNetAmount} pence`);
    }

    // Create notifications
    await createPaymentNotifications(fines, playerId, teamId, paymentMethod, totalAmount);

    // Create audit log entry
    await storage.createAuditLog({
      entityType: 'payment',
      entityId: paymentHistory.id,
      action: 'payment_completed',
      userId: processedBy || null,
      changes: {
        fineIds,
        totalAmount,
        feeAmount,
        netAmount: calculatedNetAmount,
        paymentMethod,
        paymentReference,
      },
    });

    return {
      success: true,
      finesUpdated: fines.length,
      paymentHistoryId: paymentHistory.id,
    };
  } catch (error: any) {
    console.error('Error in markAsPaid:', error);
    return {
      success: false,
      finesUpdated: 0,
      error: error.message || 'Unknown error',
    };
  }
}

async function createPaymentNotifications(
  fines: Fine[],
  playerId: string,
  teamId: string,
  paymentMethod: string,
  totalAmountPence: number
) {
  try {
    const player = await storage.getUser(playerId);
    const playerName = player ? `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Player' : 'Player';
    const totalPounds = (totalAmountPence / 100).toFixed(2);

    // Notify player (receipt)
    await storage.createNotification({
      userId: playerId,
      title: 'Payment Confirmed',
      message: `Your payment of £${totalPounds} for ${fines.length} fine(s) has been processed via ${paymentMethod}.`,
      type: 'fine_paid',
      isRead: false,
      relatedEntityId: fines[0]?.id || null,
    });

    // Notify team admins
    const team = await storage.getTeam(teamId);
    if (team) {
      const admins = await storage.getTeamAdmins(teamId);
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          title: 'Payment Received',
          message: `${playerName} paid £${totalPounds} for ${fines.length} fine(s) via ${paymentMethod}.`,
          type: 'fine_paid',
          isRead: false,
          relatedEntityId: fines[0]?.id || null,
        });
      }
    }
  } catch (error) {
    console.error('Error creating payment notifications:', error);
  }
}

export async function setFinesPendingPayment(fineIds: string[]): Promise<void> {
  for (const fineId of fineIds) {
    await storage.updateFine(fineId, {
      paymentStatus: 'pending_payment',
      updatedAt: new Date(),
    });
  }
  console.log(`Set ${fineIds.length} fines to pending_payment status`);
}

export async function revertPendingPayment(fineIds: string[]): Promise<void> {
  for (const fineId of fineIds) {
    const fine = await storage.getFine(fineId);
    if (fine && fine.paymentStatus === 'pending_payment') {
      await storage.updateFine(fineId, {
        paymentStatus: 'unpaid',
        updatedAt: new Date(),
      });
    }
  }
  console.log(`Reverted ${fineIds.length} fines from pending_payment to unpaid`);
}
