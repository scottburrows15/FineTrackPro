import type { PaymentMode } from "@shared/schema";

const FACILITATOR_FLAT_PENCE = 20;
const FACILITATOR_PERCENT = 0.01;
const FOULPAY_PERCENT = 0.02;

export interface FeeBreakdown {
  subtotalPence: number;
  facilitatorFeePence: number;
  foulPayFeePence: number;
  totalFeePence: number;
  totalPayablePence: number;
  clubNetPence: number;
}

function calculateFacilitatorFee(amountPence: number): number {
  return FACILITATOR_FLAT_PENCE + Math.ceil(amountPence * FACILITATOR_PERCENT);
}

function calculateFoulPayFee(amountPence: number): number {
  return Math.ceil(amountPence * FOULPAY_PERCENT);
}

function totalFees(amountPence: number): { facilitator: number; foulpay: number; total: number } {
  const facilitator = calculateFacilitatorFee(amountPence);
  const foulpay = calculateFoulPayFee(amountPence);
  return { facilitator, foulpay, total: facilitator + foulpay };
}

export function calculateFeeAbsorbed(subtotalPence: number): FeeBreakdown {
  const fees = totalFees(subtotalPence);
  return {
    subtotalPence,
    facilitatorFeePence: fees.facilitator,
    foulPayFeePence: fees.foulpay,
    totalFeePence: fees.total,
    totalPayablePence: subtotalPence,
    clubNetPence: subtotalPence - fees.total,
  };
}

export function calculateFeeSurcharged(subtotalPence: number): FeeBreakdown {
  let charge = subtotalPence;
  for (let i = 0; i < 100; i++) {
    const facilitator = calculateFacilitatorFee(charge);
    const foulpay = calculateFoulPayFee(charge);
    const net = charge - facilitator - foulpay;
    if (net >= subtotalPence) {
      return {
        subtotalPence,
        facilitatorFeePence: facilitator,
        foulPayFeePence: foulpay,
        totalFeePence: facilitator + foulpay,
        totalPayablePence: charge,
        clubNetPence: net,
      };
    }
    charge++;
  }
  const fees = totalFees(charge);
  return {
    subtotalPence,
    facilitatorFeePence: fees.facilitator,
    foulPayFeePence: fees.foulpay,
    totalFeePence: fees.total,
    totalPayablePence: charge,
    clubNetPence: charge - fees.total,
  };
}

export function calculateWalletTopUp(topUpPence: number): FeeBreakdown {
  const fees = totalFees(topUpPence);
  return {
    subtotalPence: topUpPence,
    facilitatorFeePence: fees.facilitator,
    foulPayFeePence: fees.foulpay,
    totalFeePence: fees.total,
    totalPayablePence: topUpPence + fees.total,
    clubNetPence: topUpPence,
  };
}

export function calculateWalletDeduction(subtotalPence: number): FeeBreakdown {
  return {
    subtotalPence,
    facilitatorFeePence: 0,
    foulPayFeePence: 0,
    totalFeePence: 0,
    totalPayablePence: subtotalPence,
    clubNetPence: subtotalPence,
  };
}

export function calculatePaymentForMode(
  mode: PaymentMode,
  subtotalPence: number,
  isWalletDeduction: boolean = false
): FeeBreakdown {
  if (isWalletDeduction) {
    return calculateWalletDeduction(subtotalPence);
  }

  switch (mode) {
    case "fee_absorbed":
      return calculateFeeAbsorbed(subtotalPence);
    case "fee_surcharged":
      return calculateFeeSurcharged(subtotalPence);
    case "wallet":
      return calculateWalletTopUp(subtotalPence);
    case "threshold":
      return calculateFeeAbsorbed(subtotalPence);
    case "time_limit":
      return calculateFeeAbsorbed(subtotalPence);
    case "monthly_sweep":
      return calculateFeeAbsorbed(subtotalPence);
    default:
      return calculateFeeAbsorbed(subtotalPence);
  }
}

export interface ThresholdCheck {
  totalPendingPence: number;
  thresholdPence: number;
  isPayable: boolean;
  shortfallPence: number;
}

export function checkThreshold(
  pendingFinesPence: number[],
  thresholdPence: number
): ThresholdCheck {
  const totalPendingPence = pendingFinesPence.reduce((sum, p) => sum + p, 0);
  const isPayable = totalPendingPence >= thresholdPence;
  return {
    totalPendingPence,
    thresholdPence,
    isPayable,
    shortfallPence: isPayable ? 0 : thresholdPence - totalPendingPence,
  };
}

export function checkTimeLimitOverride(
  fineCreatedAt: Date,
  gracePeriodDays: number
): boolean {
  const now = new Date();
  const cutoff = new Date(fineCreatedAt);
  cutoff.setDate(cutoff.getDate() + gracePeriodDays);
  return now >= cutoff;
}

export function formatPenceToPounds(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export const WALLET_TOPUP_OPTIONS_PENCE = [500, 1000, 2000, 5000];
