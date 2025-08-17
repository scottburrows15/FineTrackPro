// Open Banking integration service
import crypto from 'crypto';
import { Request, Response } from 'express';
import { db } from './db';
import { 
  paymentIntents, 
  transactions, 
  reconciliationMatches,
  obTokens,
  teams,
  fines,
  auditLog 
} from '../shared/schema';
import { eq, and, desc, gte, isNull, inArray } from 'drizzle-orm';

// Encryption utilities for storing sensitive tokens
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Generate unique payment reference
function generatePaymentReference(teamPrefix: string, intentId: string): string {
  const shortId = intentId.substring(0, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${teamPrefix}${shortId}${timestamp}`;
}

// Normalize reference for matching
function normalizeReference(ref: string): string {
  return ref.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');
}

// Extract searchable terms from transaction narrative
function extractSearchTerms(narrative: string, payerName?: string): string[] {
  const terms = new Set<string>();
  const text = `${narrative} ${payerName || ''}`.toLowerCase();
  
  // Split on common delimiters and add individual words
  const words = text.split(/[\s,.-_:;/\\()]+/).filter(word => word.length > 2);
  words.forEach(word => terms.add(word));
  
  // Add potential reference patterns (alphanumeric sequences of 6+ chars)
  const refMatches = text.match(/[a-z0-9]{6,}/g) || [];
  refMatches.forEach(match => terms.add(match.toUpperCase()));
  
  return Array.from(terms);
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}

// Main reconciliation logic
async function reconcileTransaction(transaction: any, teamId: string): Promise<void> {
  console.log(`Starting reconciliation for transaction ${transaction.id}`);
  
  // Get pending payment intents for this team
  const pendingIntents = await db
    .select()
    .from(paymentIntents)
    .where(and(
      eq(paymentIntents.teamId, teamId),
      eq(paymentIntents.status, 'pending'),
      gte(paymentIntents.expiresAt, new Date())
    ))
    .orderBy(desc(paymentIntents.createdAt));

  if (pendingIntents.length === 0) {
    console.log('No pending payment intents found');
    return;
  }

  const matches: Array<{
    intent: any;
    confidence: number;
    reason: string;
  }> = [];

  const txAmount = transaction.amountMinor;
  const txNormalized = normalizeReference(transaction.narrative || '');
  
  for (const intent of pendingIntents) {
    let confidence = 0;
    let reason = '';
    
    // 1. Exact reference match (highest confidence)
    const intentRefNormalized = normalizeReference(intent.reference);
    if (txNormalized.includes(intentRefNormalized)) {
      confidence = 1.0;
      reason = 'exact_reference_match';
    }
    // 2. Amount and prefix match
    else if (txAmount === intent.totalMinor) {
      const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
      const prefix = team[0]?.referencePrefix || 'FINE';
      
      if (txNormalized.includes(prefix.toUpperCase())) {
        confidence = 0.9;
        reason = 'amount_and_prefix_match';
      } else {
        confidence = 0.7;
        reason = 'amount_match_only';
      }
    }
    // 3. Fuzzy reference match
    else {
      const distance = levenshteinDistance(txNormalized, intentRefNormalized);
      const maxLength = Math.max(txNormalized.length, intentRefNormalized.length);
      const similarity = 1 - (distance / maxLength);
      
      if (similarity > 0.8) {
        confidence = similarity * 0.8; // Cap fuzzy matches at 0.8
        reason = 'fuzzy_reference_match';
      }
    }
    
    if (confidence > 0.5) {
      matches.push({ intent, confidence, reason });
    }
  }

  // Sort by confidence and process best match
  matches.sort((a, b) => b.confidence - a.confidence);
  
  if (matches.length === 0) {
    console.log('No matches found for transaction');
    return;
  }

  const bestMatch = matches[0];
  
  // If confidence is very high (>= 0.95), auto-settle
  if (bestMatch.confidence >= 0.95) {
    await settlePaymentIntent(bestMatch.intent, transaction, bestMatch.confidence, bestMatch.reason);
  } else {
    // Create reconciliation match for manual review
    await db.insert(reconciliationMatches).values({
      transactionId: transaction.id,
      paymentIntentId: bestMatch.intent.id,
      confidence: bestMatch.confidence,
      matchReason: bestMatch.reason
    });
    
    console.log(`Created reconciliation match with ${bestMatch.confidence} confidence`);
  }
}

// Settle a payment intent automatically
async function settlePaymentIntent(
  intent: any, 
  transaction: any, 
  confidence: number, 
  reason: string
): Promise<void> {
  console.log(`Auto-settling payment intent ${intent.id}`);
  
  await db.transaction(async (tx) => {
    // Update payment intent status
    await tx
      .update(paymentIntents)
      .set({
        status: 'settled',
        matchedTransactionId: transaction.id
      })
      .where(eq(paymentIntents.id, intent.id));

    // Get associated fines
    const intentFines = await tx
      .select({ fineId: paymentIntentFines.fineId })
      .from(paymentIntentFines)
      .where(eq(paymentIntentFines.paymentIntentId, intent.id));

    // Update all associated fines
    if (intentFines.length > 0) {
      await tx
        .update(fines)
        .set({
          status: 'paid',
          paidAt: new Date(),
          paymentMethod: 'bank_transfer',
          paymentReference: intent.reference
        })
        .where(inArray(fines.id, intentFines.map(f => f.fineId)));
    }

    // Create reconciliation match record
    await tx.insert(reconciliationMatches).values({
      transactionId: transaction.id,
      paymentIntentId: intent.id,
      confidence,
      matchReason: reason
    });

    // Log the settlement
    await tx.insert(auditLog).values({
      actorId: null, // System action
      teamId: intent.teamId,
      action: 'payment_auto_settled',
      entityType: 'payment_intent',
      entityId: intent.id,
      metadata: {
        transactionId: transaction.id,
        confidence,
        reason,
        amount: intent.totalMinor,
        reference: intent.reference
      }
    });
  });
  
  console.log(`Successfully settled payment intent ${intent.id}`);
}

// Mock Open Banking provider integration
class MockOpenBankingProvider {
  private baseUrl: string;
  
  constructor(provider: 'truelayer' | 'yapily' | 'plaid') {
    // In production, these would be real provider URLs
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://api.${provider}.com` 
      : `https://api.sandbox.${provider}.com`;
  }

  async createConsent(redirectUrl: string, teamId: string) {
    // Mock consent creation - in production this would call the real provider API
    const consentId = `consent_${crypto.randomUUID()}`;
    const authUrl = `${this.baseUrl}/auth?consent_id=${consentId}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    
    return {
      consentId,
      authUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  async exchangeCodeForTokens(code: string, consentId: string) {
    // Mock token exchange - in production this would call the real provider API
    const accessToken = `access_${crypto.randomUUID()}`;
    const refreshToken = `refresh_${crypto.randomUUID()}`;
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
      scope: 'accounts transactions'
    };
  }

  async getAccounts(accessToken: string) {
    // Mock account listing - in production this would call the real provider API
    return [
      {
        accountId: 'acc_12345',
        accountType: 'BUSINESS_CURRENT',
        displayName: 'Business Current Account',
        currency: 'GBP',
        accountNumber: '12345678',
        sortCode: '12-34-56'
      }
    ];
  }

  async getTransactions(accessToken: string, accountId: string, fromDate: string) {
    // Mock transaction fetch - in production this would call the real provider API
    // For demo purposes, return some sample transactions
    const mockTransactions = [
      {
        transactionId: `txn_${crypto.randomUUID()}`,
        amount: 1500, // £15.00
        currency: 'GBP',
        direction: 'credit',
        bookingDate: new Date().toISOString().split('T')[0],
        narrative: 'BGC PAYMENT FINE12345ABC REF',
        payerName: 'JOHN SMITH',
        payerAccount: '98765432'
      },
      {
        transactionId: `txn_${crypto.randomUUID()}`,
        amount: 2500, // £25.00
        currency: 'GBP',
        direction: 'credit',
        bookingDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        narrative: 'FASTER PAYMENT FROM SARAH JONES',
        payerName: 'SARAH JONES',
        payerAccount: '11223344'
      }
    ];
    
    return mockTransactions;
  }
}

export {
  encrypt,
  decrypt,
  generatePaymentReference,
  normalizeReference,
  extractSearchTerms,
  reconcileTransaction,
  settlePaymentIntent,
  MockOpenBankingProvider
};