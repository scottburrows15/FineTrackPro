import {
  calculateFeeAbsorbed,
  calculateFeeSurcharged,
  calculatePaymentForMode,
  type FeeBreakdown,
} from "./paymentStrategy";

export type { FeeBreakdown };
export { calculatePaymentForMode, calculateFeeAbsorbed, calculateFeeSurcharged };

export interface FeeCalculation {
  subtotalPence: number;
  foulPayFeePence: number;
  goCardlessFeePence: number;
  totalFeePence: number;
  totalChargePence: number;
  appFeePence: number;
  netWalletCreditPence: number;
}

export function calculateFoulPayFee(subtotalPence: number): number {
  return Math.ceil(subtotalPence * 0.02);
}

export function calculateGoCardlessFee(subtotalPence: number): number {
  return 20 + Math.ceil(subtotalPence * 0.01);
}

export function calculatePaymentFees(
  subtotalPence: number,
  absorbFees: boolean
): FeeCalculation {
  const foulPayFeePence = calculateFoulPayFee(subtotalPence);
  const goCardlessFeePence = calculateGoCardlessFee(subtotalPence);
  const totalFeePence = foulPayFeePence + goCardlessFeePence;

  if (absorbFees) {
    return {
      subtotalPence,
      foulPayFeePence,
      goCardlessFeePence,
      totalFeePence,
      totalChargePence: subtotalPence,
      appFeePence: foulPayFeePence,
      netWalletCreditPence: subtotalPence - totalFeePence,
    };
  } else {
    return {
      subtotalPence,
      foulPayFeePence,
      goCardlessFeePence,
      totalFeePence,
      totalChargePence: subtotalPence + totalFeePence,
      appFeePence: foulPayFeePence,
      netWalletCreditPence: subtotalPence,
    };
  }
}

export function formatPenceToPounds(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function poundsToPence(pounds: number | string): number {
  const numPounds = typeof pounds === "string" ? parseFloat(pounds) : pounds;
  return Math.round(numPounds * 100);
}

export function calculateBulkPaymentFees(
  fineAmountsPence: number[],
  absorbFees: boolean
): FeeCalculation {
  const subtotalPence = fineAmountsPence.reduce((sum, amount) => sum + amount, 0);
  return calculatePaymentFees(subtotalPence, absorbFees);
}
