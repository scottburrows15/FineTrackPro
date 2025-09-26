// Payment system routes for Open Banking integration
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from './db';
import { isAuthenticated } from './replitAuth';
import { 
  paymentIntents, 
  paymentIntentFines,
  transactions,
  reconciliationMatches,
  obTokens,
  teams,
  fines,
  users,
  auditLog 
} from '../shared/schema';
import { eq, and, desc, inArray, isNull, sql } from 'drizzle-orm';
import { 
  generatePaymentReference,
  extractSearchTerms,
  reconcileTransaction,
  MockOpenBankingProvider,
  encrypt,
  decrypt 
} from './openBanking';

const router = Router();

// Validation schemas
const createPaymentIntentSchema = z.object({
  fineIds: z.array(z.string().uuid()),
  expiresInHours: z.number().min(1).max(168).default(72) // Default 3 days
});

const manualReconcileSchema = z.object({
  transactionId: z.string().uuid(),
  paymentIntentId: z.string().uuid(),
  confidence: z.number().min(0).max(1).default(1.0)
});

// POST /api/payment-intents - Create payment intent for one or more fines
router.post('/payment-intents', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedData = createPaymentIntentSchema.parse(req.body);
    const { fineIds, expiresInHours } = validatedData;

    // Get user's team
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { team: true }
    });

    if (!user?.team) {
      return res.status(400).json({ error: 'User must belong to a team' });
    }

    // Verify all fines belong to user and are unpaid
    const userFines = await db
      .select()
      .from(fines)
      .where(and(
        inArray(fines.id, fineIds),
        eq(fines.playerId, userId),
        eq(fines.isPaid, false)
      ));

    if (userFines.length !== fineIds.length) {
      return res.status(400).json({ 
        error: 'Some fines are invalid, already paid, or do not belong to you' 
      });
    }

    // Calculate total amount (convert to minor units for payment intent)
    const totalMinor = userFines.reduce((sum, fine) => sum + Math.round(parseFloat(fine.amount) * 100), 0);

    if (totalMinor <= 0) {
      return res.status(400).json({ error: 'Total amount must be greater than zero' });
    }

    // Create payment intent
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    
    const [paymentIntent] = await db
      .insert(paymentIntents)
      .values({
        teamId: user.team.id,
        playerId: userId,
        totalMinor,
        currency: user.team.currency || 'GBP',
        reference: '', // Will be updated after creation
        status: 'pending',
        expiresAt,
        bankDetailsSnapshot: {
          accountName: user.team.bankAccountName,
          sortCode: user.team.bankSortCode,
          accountNumber: user.team.bankAccountNumber,
          iban: user.team.bankIban,
          snapshotAt: new Date().toISOString()
        }
      })
      .returning();

    // Generate unique reference using the created intent ID
    const reference = generatePaymentReference(
      user.team.referencePrefix || 'FINE',
      paymentIntent.id
    );

    // Update the payment intent with the generated reference
    await db
      .update(paymentIntents)
      .set({ reference })
      .where(eq(paymentIntents.id, paymentIntent.id));

    // Link fines to payment intent
    const intentFineLinks = fineIds.map(fineId => ({
      paymentIntentId: paymentIntent.id,
      fineId
    }));

    await db.insert(paymentIntentFines).values(intentFineLinks);

    // Log the creation
    await db.insert(auditLog).values({
      actorId: userId,
      teamId: user.team.id,
      action: 'payment_intent_created',
      entityType: 'payment_intent',
      entityId: paymentIntent.id,
      paymentIntentId: paymentIntent.id,
      metadata: {
        fineIds,
        totalMinor,
        reference,
        expiresAt: expiresAt.toISOString()
      }
    });

    console.log(`Created payment intent ${paymentIntent.id} with reference ${reference}`);

    res.json({
      id: paymentIntent.id,
      reference,
      totalMinor,
      currency: paymentIntent.currency,
      expiresAt,
      bankDetails: paymentIntent.bankDetailsSnapshot,
      fineCount: fineIds.length
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// GET /api/payment-intents/:id - View payment intent details
router.get('/payment-intents/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const intentId = req.params.id;

    // Get payment intent with related data
    const intent = await db.query.paymentIntents.findFirst({
      where: eq(paymentIntents.id, intentId),
      with: {
        team: true,
        player: true,
        fines: {
          with: {
            fine: true
          }
        },
        reconciliationMatches: {
          with: {
            transaction: true
          }
        }
      }
    });

    if (!intent) {
      return res.status(404).json({ error: 'Payment intent not found' });
    }

    // Check access permissions
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { team: true }
    });

    const canAccess = intent.playerId === userId || 
                     (user?.team?.id === intent.teamId && user?.role === 'admin');

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: intent.id,
      reference: intent.reference,
      totalMinor: intent.totalMinor,
      currency: intent.currency,
      status: intent.status,
      createdAt: intent.createdAt,
      expiresAt: intent.expiresAt,
      bankDetails: intent.bankDetailsSnapshot,
      player: {
        id: intent.player.id,
        name: intent.player.name,
        email: intent.player.email
      },
      fines: intent.fines.map(link => ({
        id: link.fine.id,
        description: link.fine.description,
        amountMinor: Math.round(parseFloat(link.fine.amount) * 100), // Convert to minor units
        createdAt: link.fine.createdAt
      })),
      matchedTransaction: intent.matchedTransactionId ? 
        intent.reconciliationMatches.find(m => m.transaction.id === intent.matchedTransactionId)?.transaction : 
        null,
      pendingMatches: intent.reconciliationMatches.filter(m => m.transaction.id !== intent.matchedTransactionId)
    });

  } catch (error) {
    console.error('Error fetching payment intent:', error);
    res.status(500).json({ error: 'Failed to fetch payment intent' });
  }
});

// GET /api/payment-intents - List user's payment intents
router.get('/payment-intents', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Get user ID from req.user.claims.sub (same pattern as /api/auth/user)
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      console.error('No user ID found in req.user.claims.sub:', {
        user: req.user,
        claims: (req.user as any)?.claims,
        isAuthenticated: req.isAuthenticated()
      });
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's team
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { team: true }
    });

    if (!user?.team) {
      return res.status(400).json({ error: 'User must belong to a team' });
    }

    // Get payment intents for this user
    const intents = await db
      .select({
        id: paymentIntents.id,
        reference: paymentIntents.reference,
        totalMinor: paymentIntents.totalMinor,
        currency: paymentIntents.currency,
        status: paymentIntents.status,
        createdAt: paymentIntents.createdAt,
        expiresAt: paymentIntents.expiresAt,
        bankDetails: paymentIntents.bankDetailsSnapshot,
        fineCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM payment_intent_fines 
          WHERE payment_intent_id = ${paymentIntents.id}
        )`
      })
      .from(paymentIntents)
      .where(and(
        eq(paymentIntents.playerId, userId),
        eq(paymentIntents.teamId, user.team.id)
      ))
      .orderBy(desc(paymentIntents.createdAt));

    res.json(intents);

  } catch (error) {
    console.error('Error fetching payment intents:', error);
    res.status(500).json({ error: 'Failed to fetch payment intents' });
  }
});

// POST /api/ob/consent/create - Start Open Banking connection
router.post('/ob/consent/create', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check admin permissions
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { team: true }
    });

    if (!user?.team || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { provider = 'truelayer' } = req.body;
    const redirectUrl = `${req.protocol}://${req.get('host')}/api/ob/consent/callback`;

    // Initialize provider (using mock for demo)
    const obProvider = new MockOpenBankingProvider(provider);
    
    // Create consent with provider
    const consent = await obProvider.createConsent(redirectUrl, user.team.id);

    // Update team with consent details
    await db
      .update(teams)
      .set({
        obProvider: provider,
        obConsentId: consent.consentId
      })
      .where(eq(teams.id, user.team.id));

    // Log the consent creation
    await db.insert(auditLog).values({
      actorId: userId,
      teamId: user.team.id,
      action: 'ob_consent_created',
      entityType: 'team',
      entityId: user.team.id,
      metadata: {
        provider,
        consentId: consent.consentId
      }
    });

    console.log(`Created Open Banking consent for team ${user.team.id}`);

    res.json({
      consentId: consent.consentId,
      authUrl: consent.authUrl,
      provider,
      expiresAt: consent.expiresAt
    });

  } catch (error) {
    console.error('Error creating Open Banking consent:', error);
    res.status(500).json({ error: 'Failed to create Open Banking consent' });
  }
});

// GET /api/ob/consent/callback - Handle OAuth callback
router.get('/ob/consent/callback', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { code, state, consent_id } = req.query;

    if (!code || !consent_id) {
      return res.status(400).json({ error: 'Missing authorization code or consent ID' });
    }

    // Find team by consent ID
    const team = await db.query.teams.findFirst({
      where: eq(teams.obConsentId, consent_id as string)
    });

    if (!team) {
      return res.status(404).json({ error: 'Invalid consent ID' });
    }

    // Initialize provider
    const obProvider = new MockOpenBankingProvider(team.obProvider as any);

    // Exchange code for tokens
    const tokenData = await obProvider.exchangeCodeForTokens(code as string, consent_id as string);

    // Store encrypted tokens
    const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);
    
    await db.insert(obTokens).values({
      teamId: team.id,
      provider: team.obProvider!,
      accessTokenEncrypted: encrypt(tokenData.accessToken),
      refreshTokenEncrypted: tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null,
      expiresAt,
      scope: tokenData.scope
    }).onConflictDoUpdate({
      target: [obTokens.teamId, obTokens.provider],
      set: {
        accessTokenEncrypted: encrypt(tokenData.accessToken),
        refreshTokenEncrypted: tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null,
        expiresAt,
        scope: tokenData.scope,
        updatedAt: new Date()
      }
    });

    // Get account information
    const accounts = await obProvider.getAccounts(tokenData.accessToken);
    const primaryAccount = accounts[0]; // Use first account for simplicity

    if (primaryAccount) {
      // Update team with account details
      await db
        .update(teams)
        .set({
          obAccountId: primaryAccount.accountId,
          bankAccountName: primaryAccount.displayName,
          bankSortCode: primaryAccount.sortCode,
          bankAccountNumber: primaryAccount.accountNumber
        })
        .where(eq(teams.id, team.id));
    }

    // Log successful connection
    await db.insert(auditLog).values({
      actorId: null, // System action
      teamId: team.id,
      action: 'ob_connection_established',
      entityType: 'team',
      entityId: team.id,
      metadata: {
        provider: team.obProvider,
        accountId: primaryAccount?.accountId,
        accountCount: accounts.length
      }
    });

    console.log(`Open Banking connection established for team ${team.id}`);

    // Redirect to success page
    res.redirect('/dashboard?ob_connected=true');

  } catch (error) {
    console.error('Error handling Open Banking callback:', error);
    res.redirect('/dashboard?ob_error=true');
  }
});

// POST /api/ob/sync - Poll provider for new transactions and reconcile
router.post('/ob/sync', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's team and check admin permissions
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { team: true }
    });

    if (!user?.team || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const team = user.team;

    // Get stored tokens
    const tokenRecord = await db.query.obTokens.findFirst({
      where: and(
        eq(obTokens.teamId, team.id),
        eq(obTokens.provider, team.obProvider!)
      )
    });

    if (!tokenRecord) {
      return res.status(400).json({ error: 'No Open Banking connection found' });
    }

    // Check if token is expired
    if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Open Banking token expired' });
    }

    // Decrypt access token
    const accessToken = decrypt(tokenRecord.accessTokenEncrypted);

    // Initialize provider and fetch transactions
    const obProvider = new MockOpenBankingProvider(team.obProvider as any);
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 7 days
    
    const newTransactions = await obProvider.getTransactions(accessToken, team.obAccountId!, fromDate);

    let processedCount = 0;
    let reconciledCount = 0;

    // Process each transaction
    for (const txData of newTransactions) {
      // Check if transaction already exists
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
        amountMinor: Math.round(txData.amount * 100), // Convert to minor units
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
    }

    // Log the sync operation
    await db.insert(auditLog).values({
      actorId: userId,
      teamId: team.id,
      action: 'ob_sync_completed',
      entityType: 'team',
      entityId: team.id,
      metadata: {
        transactionsProcessed: processedCount,
        transactionsReconciled: reconciledCount,
        fromDate
      }
    });

    console.log(`Synced ${processedCount} transactions, reconciled ${reconciledCount} for team ${team.id}`);

    res.json({
      success: true,
      transactionsProcessed: processedCount,
      transactionsReconciled: reconciledCount,
      fromDate
    });

  } catch (error) {
    console.error('Error syncing Open Banking transactions:', error);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
});

// GET /api/transactions - List transactions with match status
router.get('/transactions', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's team
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { team: true }
    });

    if (!user?.team) {
      return res.status(400).json({ error: 'User must belong to a team' });
    }

    const { matched, limit = 50 } = req.query;

    // Build query based on match status filter
    let query = db
      .select({
        transaction: transactions,
        matches: reconciliationMatches
      })
      .from(transactions)
      .leftJoin(reconciliationMatches, eq(transactions.id, reconciliationMatches.transactionId))
      .where(eq(transactions.teamId, user.team.id))
      .orderBy(desc(transactions.bookingDate))
      .limit(Number(limit));

    const results = await query;

    // Group by transaction and aggregate matches
    const transactionMap = new Map();
    
    results.forEach(row => {
      const tx = row.transaction;
      if (!transactionMap.has(tx.id)) {
        transactionMap.set(tx.id, {
          ...tx,
          matches: []
        });
      }
      
      if (row.matches) {
        transactionMap.get(tx.id).matches.push(row.matches);
      }
    });

    let transactions = Array.from(transactionMap.values());

    // Apply match status filter
    if (matched === 'true') {
      transactions = transactions.filter(tx => tx.matches.length > 0);
    } else if (matched === 'false') {
      transactions = transactions.filter(tx => tx.matches.length === 0);
    }

    res.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        amount: Math.round(tx.amountMinor / 100), // Convert from minor units to major units
        currency: tx.currency,
        direction: tx.direction,
        bookingDate: tx.bookingDate,
        narrative: tx.narrative,
        payerName: tx.payerName,
        matchCount: tx.matches.length,
        isMatched: tx.matches.length > 0,
        bestMatch: tx.matches.length > 0 ? 
          tx.matches.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
          ) : null
      })),
      total: transactions.length,
      hasMore: transactions.length === Number(limit)
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/reconcile/manual - Manually link transaction to payment intent
router.post('/reconcile/manual', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check admin permissions
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { team: true }
    });

    if (!user?.team || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const validatedData = manualReconcileSchema.parse(req.body);
    const { transactionId, paymentIntentId, confidence } = validatedData;

    // Verify transaction and payment intent belong to the team
    const transaction = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, transactionId),
        eq(transactions.teamId, user.team.id)
      )
    });

    const intent = await db.query.paymentIntents.findFirst({
      where: and(
        eq(paymentIntents.id, paymentIntentId),
        eq(paymentIntents.teamId, user.team.id),
        eq(paymentIntents.status, 'pending')
      )
    });

    if (!transaction || !intent) {
      return res.status(404).json({ error: 'Transaction or payment intent not found' });
    }

    // Import the settlement function
    const { settlePaymentIntent } = await import('./openBanking');
    
    // Settle the payment intent
    await settlePaymentIntent(intent, transaction, confidence, 'manual_reconciliation');

    // Log the manual reconciliation
    await db.insert(auditLog).values({
      actorId: userId,
      teamId: user.team.id,
      action: 'manual_reconciliation',
      entityType: 'payment_intent',
      entityId: paymentIntentId,
      paymentIntentId,
      metadata: {
        transactionId,
        confidence,
        adminId: userId
      }
    });

    console.log(`Manual reconciliation completed by admin ${userId}`);

    res.json({
      success: true,
      message: 'Payment intent settled successfully',
      paymentIntentId,
      transactionId
    });

  } catch (error) {
    console.error('Error in manual reconciliation:', error);
    res.status(500).json({ error: 'Failed to reconcile payment' });
  }
});

export default router;