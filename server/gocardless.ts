import { Router, Request, Response } from 'express';
import { storage } from './storage';
import { calculatePaymentFees, poundsToPence, formatPenceToPounds } from './fees';
import type { Team } from '@shared/schema';
import crypto from 'crypto';

const router = Router();

const GOCARDLESS_CLIENT_ID = process.env.GOCARDLESS_CLIENT_ID;
const GOCARDLESS_CLIENT_SECRET = process.env.GOCARDLESS_CLIENT_SECRET;
const GOCARDLESS_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'live' : 'sandbox';
const GOCARDLESS_OAUTH_BASE = GOCARDLESS_ENVIRONMENT === 'live' 
  ? 'https://connect.gocardless.com'
  : 'https://connect-sandbox.gocardless.com';

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

// Check if team has payments enabled (for player payment page)
router.get('/api/team/payment-status', isAuthenticated, async (req: any, res: Response) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || !user.teamId) {
      return res.status(400).json({ message: 'User not found or not in a team' });
    }

    const team = await storage.getTeam(user.teamId);
    if (!team) {
      return res.status(400).json({ message: 'Team not found' });
    }

    res.json({
      goCardlessConnected: !!team.goCardlessAccessToken,
      teamName: team.name,
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ message: 'Failed to check payment status' });
  }
});

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

    // Calculate fees - absorbFees is the opposite of passFeesToPlayer
    const absorbFees = !(team.passFeesToPlayer ?? false);
    const fees = calculatePaymentFees(totalFineAmountPence, absorbFees);

    res.json({
      subtotalPounds: formatPenceToPounds(fees.subtotalPence),
      foulPayFeePounds: formatPenceToPounds(fees.foulPayFeePence),
      goCardlessFeePounds: formatPenceToPounds(fees.goCardlessFeePence),
      totalFeePounds: formatPenceToPounds(fees.totalFeePence),
      totalChargePounds: formatPenceToPounds(fees.totalChargePence),
      absorbFees,
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

    // Calculate fees - absorbFees is the opposite of passFeesToPlayer
    const absorbFees = !(team.passFeesToPlayer ?? false);
    const fees = calculatePaymentFees(totalFineAmountPence, absorbFees);

    const client = getGoCardlessClient(team.goCardlessAccessToken);

    // Build fine descriptions for the payment
    const fineDescriptions = validFines.map(f => f.reason || f.description || 'Fine').join(', ');
    const paymentDescription = `FoulPay: ${fineDescriptions}`.substring(0, 140);

    // Create the billing request for Instant Bank Pay
    // Note: For IBP, we use payment_request only (no mandate_request)
    const billingRequest = await client.billingRequests.create({
      payment_request: {
        description: paymentDescription,
        amount: fees.totalChargePence.toString(),
        currency: 'GBP',
        app_fee: fees.appFeePence.toString(),
        scheme: 'faster_payments', // Use Faster Payments for IBP
      },
    });

    // Create a billing request flow for the redirect URL
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.PRODUCTION_URL || 'http://localhost:5000';

    const billingRequestFlow = await client.billingRequestFlows.create({
      redirect_uri: `${baseUrl}/payments/callback`,
      exit_uri: `${baseUrl}/player/pay`,
      links: {
        billing_request: billingRequest.id!,
      },
      auto_fulfil: true,
    });

    // Store the billing request in our database
    const gcRequest = await storage.createGcBillingRequest({
      teamId: team.id,
      playerId: user.id,
      billingRequestId: billingRequest.id,
      billingRequestFlowId: billingRequestFlow.id,
      fineAmount: fees.subtotalPence,
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
      redirectUrl: billingRequestFlow.authorisation_url,
      totalCharge: formatPenceToPounds(fees.totalChargePence),
    });
  } catch (error: any) {
    console.error('Error creating GoCardless billing request:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment request' });
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

// =====================
// GoCardless OAuth Endpoints
// =====================

// Get GoCardless connection status
router.get('/api/admin/gocardless/status', isAuthenticated, async (req: any, res: Response) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || user.role !== 'admin' || !user.teamId) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const team = await storage.getTeam(user.teamId);
    if (!team) {
      return res.status(400).json({ message: 'Team not found' });
    }

    const isConnected = !!team.goCardlessAccessToken;
    
    res.json({
      connected: isConnected,
      organisationId: team.goCardlessOrganisationId || null,
      connectedAt: team.goCardlessConnectedAt || null,
    });
  } catch (error) {
    console.error('Error getting GoCardless status:', error);
    res.status(500).json({ message: 'Failed to get connection status' });
  }
});

// Start GoCardless OAuth flow
router.post('/api/admin/gocardless/connect', isAuthenticated, async (req: any, res: Response) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || user.role !== 'admin' || !user.teamId) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const team = await storage.getTeam(user.teamId);
    if (!team) {
      return res.status(400).json({ message: 'Team not found' });
    }

    if (!GOCARDLESS_CLIENT_ID) {
      return res.status(500).json({ message: 'GoCardless is not configured. Please contact support.' });
    }

    // Generate a secure random state token
    const state = crypto.randomBytes(32).toString('hex');
    const stateExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store the state in the team record
    await storage.updateTeam(user.teamId, {
      goCardlessOAuthState: state,
      goCardlessOAuthStateExpiresAt: stateExpiresAt,
    });

    // Build the OAuth authorization URL
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.PRODUCTION_URL || 'http://localhost:5000';

    const redirectUri = `${baseUrl}/api/admin/gocardless/callback`;
    
    // Build OAuth params - order matters for consistency
    const params = new URLSearchParams();
    params.append('client_id', GOCARDLESS_CLIENT_ID);
    params.append('redirect_uri', redirectUri);
    params.append('scope', 'read_write');
    params.append('response_type', 'code');
    params.append('initial_view', 'login');
    params.append('state', state);

    const authorizeUrl = `${GOCARDLESS_OAUTH_BASE}/oauth/authorize?${params.toString()}`;
    
    // Log for debugging
    console.log('GoCardless OAuth URL generated:', {
      baseUrl: GOCARDLESS_OAUTH_BASE,
      clientId: GOCARDLESS_CLIENT_ID ? `${GOCARDLESS_CLIENT_ID.substring(0, 8)}...` : 'NOT SET',
      redirectUri,
      fullUrl: authorizeUrl,
    });

    await storage.createAuditLog({
      entityType: 'team',
      entityId: user.teamId,
      action: 'gocardless_connect_started',
      userId: user.id,
      changes: { initiatedAt: new Date().toISOString() },
    });

    res.json({ authorizeUrl });
  } catch (error) {
    console.error('Error starting GoCardless connect:', error);
    res.status(500).json({ message: 'Failed to start connection' });
  }
});

// OAuth callback from GoCardless
router.get('/api/admin/gocardless/callback', async (req: Request, res: Response) => {
  // Log ALL query parameters for debugging
  console.log('GoCardless callback received with query:', JSON.stringify(req.query));
  
  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors from GoCardless
    if (error) {
      console.error('GoCardless OAuth error:', error, error_description);
      await storage.createAuditLog({
        entityType: 'gocardless_oauth',
        entityId: 'callback_error',
        action: 'oauth_error',
        userId: null,
        changes: { error: String(error), description: String(error_description || '') },
      });
      return res.redirect('/admin/settings?gocardless=error&message=' + encodeURIComponent(String(error_description || error)));
    }

    // Validate required parameters
    if (!code || typeof code !== 'string') {
      console.error('OAuth callback missing code parameter');
      return res.redirect('/admin/settings?gocardless=error&message=Missing+authorization+code');
    }

    if (!state || typeof state !== 'string' || state.length !== 64) {
      console.error('OAuth callback invalid state parameter:', { stateLength: state ? String(state).length : 0 });
      return res.redirect('/admin/settings?gocardless=error&message=Invalid+session');
    }

    // Find the team by state token - this validates the state matches a pending OAuth flow
    const team = await storage.getTeamByGoCardlessState(String(state));
    if (!team) {
      console.error('No team found with matching state token - possible CSRF or expired session');
      await storage.createAuditLog({
        entityType: 'gocardless_oauth',
        entityId: 'callback_invalid_state',
        action: 'invalid_state',
        userId: null,
        changes: { reason: 'No matching team found for state token' },
      });
      return res.redirect('/admin/settings?gocardless=error&message=Invalid+or+expired+session');
    }

    // Check if state has expired (10 minute window)
    if (team.goCardlessOAuthStateExpiresAt && new Date() > team.goCardlessOAuthStateExpiresAt) {
      // Clear the expired state
      await storage.updateTeam(team.id, {
        goCardlessOAuthState: null,
        goCardlessOAuthStateExpiresAt: null,
      });
      console.error('OAuth state expired for team:', team.id);
      return res.redirect('/admin/settings?gocardless=error&message=Session+expired');
    }

    if (!GOCARDLESS_CLIENT_ID || !GOCARDLESS_CLIENT_SECRET) {
      return res.redirect('/admin/settings?gocardless=error&message=GoCardless+not+configured');
    }

    // Exchange the authorization code for tokens
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.PRODUCTION_URL || 'http://localhost:5000';

    const tokenResponse = await fetch(`${GOCARDLESS_OAUTH_BASE}/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: GOCARDLESS_CLIENT_ID,
        client_secret: GOCARDLESS_CLIENT_SECRET,
        redirect_uri: `${baseUrl}/api/admin/gocardless/callback`,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return res.redirect('/admin/settings?gocardless=error&message=Authorization+failed');
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      organisation_id?: string;
    };

    // Clear the client cache for this team if they had a previous token
    if (team.goCardlessAccessToken) {
      gocardlessClients.delete(team.goCardlessAccessToken);
    }

    // Store the tokens
    await storage.updateTeam(team.id, {
      goCardlessAccessToken: tokenData.access_token,
      goCardlessRefreshToken: tokenData.refresh_token || null,
      goCardlessOrganisationId: tokenData.organisation_id || null,
      goCardlessConnectedAt: new Date(),
      goCardlessOAuthState: null,
      goCardlessOAuthStateExpiresAt: null,
    });

    await storage.createAuditLog({
      entityType: 'team',
      entityId: team.id,
      action: 'gocardless_connected',
      userId: null, // Callback doesn't have user context
      changes: { connectedAt: new Date().toISOString() },
    });

    res.redirect('/admin/settings?gocardless=success');
  } catch (error) {
    console.error('Error in GoCardless callback:', error);
    res.redirect('/admin/settings?gocardless=error&message=Connection+failed');
  }
});

// Disconnect GoCardless
router.delete('/api/admin/gocardless/disconnect', isAuthenticated, async (req: any, res: Response) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || user.role !== 'admin' || !user.teamId) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const team = await storage.getTeam(user.teamId);
    if (!team) {
      return res.status(400).json({ message: 'Team not found' });
    }

    if (!team.goCardlessAccessToken) {
      return res.status(400).json({ message: 'GoCardless is not connected' });
    }

    // Clear the client cache
    gocardlessClients.delete(team.goCardlessAccessToken);

    // Revoke the token with GoCardless (best effort)
    try {
      if (GOCARDLESS_CLIENT_ID && GOCARDLESS_CLIENT_SECRET) {
        await fetch(`${GOCARDLESS_OAUTH_BASE}/oauth/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: GOCARDLESS_CLIENT_ID,
            client_secret: GOCARDLESS_CLIENT_SECRET,
            token: team.goCardlessAccessToken,
          }),
        });
      }
    } catch (revokeError) {
      console.error('Failed to revoke GoCardless token:', revokeError);
      // Continue with local cleanup even if revocation fails
    }

    // Clear stored credentials
    await storage.updateTeam(user.teamId, {
      goCardlessAccessToken: null,
      goCardlessRefreshToken: null,
      goCardlessOrganisationId: null,
      goCardlessConnectedAt: null,
    });

    await storage.createAuditLog({
      entityType: 'team',
      entityId: user.teamId,
      action: 'gocardless_disconnected',
      userId: user.id,
      changes: { disconnectedAt: new Date().toISOString() },
    });

    res.json({ message: 'GoCardless disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting GoCardless:', error);
    res.status(500).json({ message: 'Failed to disconnect' });
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
