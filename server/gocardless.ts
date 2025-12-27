import { Router, Request, Response } from 'express';
import { storage } from './storage';
import { calculatePaymentFees, poundsToPence, formatPenceToPounds } from './fees';
import type { Team } from '@shared/schema';

const router = Router();

// Cache GoCardless clients per access token to support multiple teams
const gocardlessClients = new Map<string, any>();

function getGoCardlessClient(accessToken: string) {
  // Check if we already have a client for this token
  if (gocardlessClients.has(accessToken)) {
    return gocardlessClients.get(accessToken);
  }

  // Create a new client for this token
  const gocardless = require('gocardless-nodejs');
  const { Environments } = require('gocardless-nodejs/constants');
  const environment = process.env.NODE_ENV === 'production' 
    ? Environments.Live 
    : Environments.Sandbox;
  
  const client = gocardless(accessToken, environment);
  gocardlessClients.set(accessToken, client);
  
  return client;
}

// Middleware to check authentication
function isAuthenticated(req: any, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

// Calculate payment preview (for showing fees to player before payment)
router.post('/api/payments/preview', isAuthenticated, async (req: any, res: Response) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || !user.teamId) {
      return res.status(400).json({ message: 'User not found or not in a team' });
    }

    const team = await storage.getTeam(user.teamId);
    if (!team) {
      return res.status(400).json({ message: 'Team not found' });
    }

    const { fineIds } = req.body;
    if (!fineIds || !Array.isArray(fineIds) || fineIds.length === 0) {
      return res.status(400).json({ message: 'fineIds array is required' });
    }

    // Get fines and calculate total
    let totalFineAmountPence = 0;
    const fines = [];
    for (const fineId of fineIds) {
      const fine = await storage.getFineById(fineId);
      if (!fine) {
        return res.status(404).json({ message: `Fine ${fineId} not found` });
      }
      if (fine.isPaid) {
        return res.status(400).json({ message: `Fine ${fineId} is already paid` });
      }
      if (fine.playerId !== user.id) {
        return res.status(403).json({ message: `Fine ${fineId} does not belong to you` });
      }
      totalFineAmountPence += poundsToPence(fine.amount);
      fines.push(fine);
    }

    // Calculate fees
    const passFeesToPlayer = team.passFeesToPlayer ?? false;
    const fees = calculatePaymentFees(totalFineAmountPence, passFeesToPlayer);

    res.json({
      fineAmountPounds: formatPenceToPounds(fees.fineAmountPence),
      foulPayFeePounds: formatPenceToPounds(fees.foulPayFeePence),
      goCardlessFeePounds: formatPenceToPounds(fees.goCardlessFeePence),
      totalFeePounds: formatPenceToPounds(fees.totalFeePence),
      totalChargePounds: formatPenceToPounds(fees.totalChargePence),
      passFeesToPlayer,
      breakdown: fees,
    });
  } catch (error) {
    console.error('Error calculating payment preview:', error);
    res.status(500).json({ message: 'Failed to calculate payment preview' });
  }
});

// Create a GoCardless Billing Request for Instant Bank Pay
router.post('/api/payments/create', isAuthenticated, async (req: any, res: Response) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || !user.teamId) {
      return res.status(400).json({ message: 'User not found or not in a team' });
    }

    const team = await storage.getTeam(user.teamId);
    if (!team) {
      return res.status(400).json({ message: 'Team not found' });
    }

    if (!team.goCardlessAccessToken) {
      return res.status(400).json({ message: 'Team has not configured GoCardless payments' });
    }

    const { fineIds } = req.body;
    if (!fineIds || !Array.isArray(fineIds) || fineIds.length === 0) {
      return res.status(400).json({ message: 'fineIds array is required' });
    }

    // Get fines and validate
    let totalFineAmountPence = 0;
    const validFines = [];
    for (const fineId of fineIds) {
      const fine = await storage.getFineById(fineId);
      if (!fine) {
        return res.status(404).json({ message: `Fine ${fineId} not found` });
      }
      if (fine.isPaid) {
        return res.status(400).json({ message: `Fine ${fineId} is already paid` });
      }
      if (fine.playerId !== user.id) {
        return res.status(403).json({ message: `Fine ${fineId} does not belong to you` });
      }
      totalFineAmountPence += poundsToPence(fine.amount);
      validFines.push(fine);
    }

    // Calculate fees
    const passFeesToPlayer = team.passFeesToPlayer ?? false;
    const fees = calculatePaymentFees(totalFineAmountPence, passFeesToPlayer);

    const client = getGoCardlessClient(team.goCardlessAccessToken);

    // Create the billing request
    const billingRequest = await client.billingRequests.create({
      payment_request: {
        description: `FoulPay fine payment - ${validFines.length} fine(s)`,
        amount: fees.totalChargePence.toString(),
        currency: 'GBP',
        app_fee: fees.foulPayFeePence.toString(),
      },
      mandate_request: {
        scheme: 'bacs', // UK bank scheme
      },
    });

    // Create a billing request flow for the redirect URL
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.PRODUCTION_URL || 'http://localhost:5000';

    const billingRequestFlow = await client.billingRequestFlows.create({
      redirect_uri: `${baseUrl}/payments/callback`,
      exit_uri: `${baseUrl}/player`,
      links: {
        billing_request: billingRequest.id!,
      },
    });

    // Store the billing request in our database
    const gcRequest = await storage.createGcBillingRequest({
      teamId: team.id,
      playerId: user.id,
      billingRequestId: billingRequest.id,
      billingRequestFlowId: billingRequestFlow.id,
      fineAmount: fees.fineAmountPence,
      foulPayFee: fees.foulPayFeePence,
      goCardlessFee: fees.goCardlessFeePence,
      totalCharged: fees.totalChargePence,
      netWalletCredit: fees.netWalletCreditPence,
      status: 'pending',
      fineIds: fineIds,
      redirectUrl: billingRequestFlow.authorisation_url,
    });

    res.json({
      billingRequestId: gcRequest.id,
      authorisationUrl: billingRequestFlow.authorisation_url,
      totalCharge: formatPenceToPounds(fees.totalChargePence),
    });
  } catch (error: any) {
    console.error('Error creating GoCardless billing request:', error);
    res.status(500).json({ message: error.message || 'Failed to create payment request' });
  }
});

// Webhook handler for GoCardless events
router.post('/api/webhooks/gocardless', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['webhook-signature'] as string;
    const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET;

    // Note: In production, verify the webhook signature
    // For now, we'll process the events
    const events = req.body.events || [];

    for (const event of events) {
      console.log(`Processing GoCardless event: ${event.resource_type} - ${event.action}`);

      switch (event.resource_type) {
        case 'payments':
          await handlePaymentEvent(event);
          break;
        case 'payouts':
          await handlePayoutEvent(event);
          break;
        default:
          console.log(`Unhandled event type: ${event.resource_type}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing GoCardless webhook:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

async function handlePaymentEvent(event: any) {
  const paymentId = event.links?.payment;
  const action = event.action;

  if (!paymentId) return;

  // Find the billing request by payment ID
  const gcRequest = await storage.getGcBillingRequestByPaymentId(paymentId);
  if (!gcRequest) {
    console.log(`No billing request found for payment ${paymentId}`);
    return;
  }

  if (action === 'confirmed') {
    // Payment confirmed - mark fines as paid and credit wallet
    const fineIds = gcRequest.fineIds as string[];
    
    // Mark all fines as paid
    for (const fineId of fineIds) {
      await storage.updateFine(fineId, {
        isPaid: true,
        paidAt: new Date(),
        paymentMethod: 'gocardless',
        paymentIntentId: paymentId,
      });
    }

    // Credit the team wallet with the net amount
    await storage.creditWallet(gcRequest.teamId, gcRequest.netWalletCredit);

    // Update billing request status
    await storage.updateGcBillingRequest(gcRequest.id, {
      status: 'confirmed',
      confirmedAt: new Date(),
    });

    // Create notification for the player
    const fines = await Promise.all(fineIds.map(id => storage.getFineById(id)));
    const totalPaid = fines.reduce((sum, f) => f ? sum + poundsToPence(f.amount) : sum, 0);
    
    await storage.createNotification({
      userId: gcRequest.playerId,
      title: 'Payment Confirmed',
      message: `Your payment of ${formatPenceToPounds(totalPaid)} has been confirmed.`,
      type: 'payment_confirmed',
      relatedEntityId: gcRequest.id,
    });

    console.log(`Payment ${paymentId} confirmed. ${fineIds.length} fines marked as paid.`);
  } else if (action === 'failed' || action === 'cancelled') {
    await storage.updateGcBillingRequest(gcRequest.id, {
      status: action,
      failureReason: event.details?.cause || 'Unknown',
    });
    
    console.log(`Payment ${paymentId} ${action}`);
  }
}

async function handlePayoutEvent(event: any) {
  const payoutId = event.links?.payout;
  const action = event.action;

  if (!payoutId) return;

  // Find the payout by GoCardless payout ID
  const payouts = await storage.getTeamPayouts(''); // We'll need to search differently
  // This is a simplified implementation - in production, add a lookup by gcPayoutId
  
  if (action === 'paid') {
    // Payout completed - update status
    console.log(`Payout ${payoutId} marked as paid`);
  }
}

// Get wallet balance for admin
router.get('/api/admin/wallet', isAuthenticated, async (req: any, res: Response) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || user.role !== 'admin' || !user.teamId) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const wallet = await storage.getOrCreateTeamWallet(user.teamId);
    const payouts = await storage.getTeamPayouts(user.teamId);
    
    res.json({
      availableBalance: wallet.availableBalance,
      availableBalancePounds: formatPenceToPounds(wallet.availableBalance),
      pendingBalance: wallet.pendingBalance,
      pendingBalancePounds: formatPenceToPounds(wallet.pendingBalance),
      recentPayouts: payouts.slice(0, 10).map(p => ({
        ...p,
        amountPounds: formatPenceToPounds(p.amount),
      })),
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    res.status(500).json({ message: 'Failed to get wallet balance' });
  }
});

// Request withdrawal
router.post('/api/admin/wallet/withdraw', isAuthenticated, async (req: any, res: Response) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || user.role !== 'admin' || !user.teamId) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { amountPence } = req.body;
    if (!amountPence || amountPence <= 0) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    const wallet = await storage.getTeamWallet(user.teamId);
    if (!wallet || wallet.availableBalance < amountPence) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const team = await storage.getTeam(user.teamId);
    if (!team) {
      return res.status(400).json({ message: 'Team not found' });
    }

    // Debit the wallet
    await storage.debitWallet(user.teamId, amountPence);

    // Create a payout record
    const payout = await storage.createPayout({
      teamId: user.teamId,
      amount: amountPence,
      status: 'pending',
      bankAccountName: team.bankAccountName || undefined,
      bankSortCode: team.bankSortCode || undefined,
      bankAccountNumber: team.bankAccountNumber || undefined,
    });

    // In production, you would initiate the actual payout via GoCardless here
    // For now, we'll just mark it as processing
    await storage.updatePayout(payout.id, { status: 'processing' });

    res.json({
      message: 'Withdrawal request submitted',
      payout: {
        ...payout,
        amountPounds: formatPenceToPounds(payout.amount),
      },
    });
  } catch (error: any) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ message: error.message || 'Failed to process withdrawal' });
  }
});

// Update team's pass_fees_to_player setting
router.patch('/api/admin/team/fee-settings', isAuthenticated, async (req: any, res: Response) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || user.role !== 'admin' || !user.teamId) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { passFeesToPlayer } = req.body;
    if (typeof passFeesToPlayer !== 'boolean') {
      return res.status(400).json({ message: 'passFeesToPlayer must be a boolean' });
    }

    const updatedTeam = await storage.updateTeam(user.teamId, { passFeesToPlayer });

    await storage.createAuditLog({
      entityType: 'team',
      entityId: user.teamId,
      action: 'update_fee_settings',
      userId: user.id,
      changes: { passFeesToPlayer },
    });

    res.json({ passFeesToPlayer: updatedTeam.passFeesToPlayer });
  } catch (error) {
    console.error('Error updating fee settings:', error);
    res.status(500).json({ message: 'Failed to update fee settings' });
  }
});

export default router;
