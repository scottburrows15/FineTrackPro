-- Migration 001: Open Banking Payment System
-- Creates tables for automatic bank transfer verification

-- Add Open Banking fields to existing teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS ob_provider VARCHAR(50);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS ob_account_id VARCHAR(255);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS ob_consent_id VARCHAR(255);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS bank_sort_code VARCHAR(10);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(20);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS bank_iban VARCHAR(50);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS reference_prefix VARCHAR(10) DEFAULT 'FINE';

-- Payment intents table - groups fines for payment with unique reference
CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_minor INTEGER NOT NULL, -- Amount in pence/cents
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    reference VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    bank_details_snapshot JSONB, -- Snapshot of bank details at creation
    matched_transaction_id UUID,
    CONSTRAINT check_total_positive CHECK (total_minor > 0),
    CONSTRAINT check_status_valid CHECK (status IN ('pending', 'settled', 'expired', 'cancelled'))
);

-- Link table between payment intents and individual fines
CREATE TABLE IF NOT EXISTS payment_intent_fines (
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
    fine_id UUID NOT NULL REFERENCES fines(id) ON DELETE CASCADE,
    PRIMARY KEY (payment_intent_id, fine_id)
);

-- Bank transactions table - stores incoming transactions from Open Banking
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    provider_txn_id VARCHAR(255) NOT NULL,
    amount_minor INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    direction VARCHAR(10) NOT NULL DEFAULT 'credit',
    booking_date DATE NOT NULL,
    value_date DATE,
    narrative TEXT,
    payer_name VARCHAR(255),
    payer_account_identifier VARCHAR(100), -- IBAN or sort code + account number
    raw_data JSONB, -- Full transaction data from provider
    indexed_terms TEXT[], -- Searchable terms extracted from narrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, provider_txn_id),
    CONSTRAINT check_direction_valid CHECK (direction IN ('credit', 'debit'))
);

-- Reconciliation matches - links transactions to payment intents
CREATE TABLE IF NOT EXISTS reconciliation_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
    confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    match_reason VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(transaction_id, payment_intent_id),
    CONSTRAINT check_confidence_range CHECK (confidence >= 0.00 AND confidence <= 1.00)
);

-- Open Banking tokens (encrypted storage)
CREATE TABLE IF NOT EXISTS ob_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, provider)
);

-- Add new fields to existing fines table
ALTER TABLE fines ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(50);
ALTER TABLE fines ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'manual';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_intents_reference ON payment_intents(reference);
CREATE INDEX IF NOT EXISTS idx_payment_intents_team_status ON payment_intents(team_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_player ON payment_intents(player_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_expires ON payment_intents(expires_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_transactions_provider_txn ON transactions(team_id, provider_txn_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_date ON transactions(team_id, booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(team_id, amount_minor);
CREATE INDEX IF NOT EXISTS idx_transactions_narrative ON transactions USING gin(indexed_terms);

CREATE INDEX IF NOT EXISTS idx_reconciliation_transaction ON reconciliation_matches(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_payment_intent ON reconciliation_matches(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_confidence ON reconciliation_matches(confidence DESC);

CREATE INDEX IF NOT EXISTS idx_ob_tokens_team ON ob_tokens(team_id);
CREATE INDEX IF NOT EXISTS idx_ob_tokens_expires ON ob_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_fines_payment_reference ON fines(payment_reference) WHERE payment_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fines_payment_method ON fines(payment_method);

-- Update audit log for payment-related actions
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS payment_intent_id UUID REFERENCES payment_intents(id);
CREATE INDEX IF NOT EXISTS idx_audit_log_payment_intent ON audit_log(payment_intent_id) WHERE payment_intent_id IS NOT NULL;