/**
 * FoulPay Fee Calculation Helper
 * All calculations use integer pence to avoid floating-point precision issues
 * 
 * Fee Structure:
 * - FoulPay Fee: 2% if subtotal < £10, otherwise 1% + 10p
 * - GoCardless IBP Fee: Flat 1% of subtotal (no flat pence addition)
 */

export interface FeeCalculation {
  subtotalPence: number;          // Subtotal of fines in pence (before fees)
  foulPayFeePence: number;        // FoulPay platform fee in pence
  goCardlessFeePence: number;     // GoCardless 1% fee in pence
  totalFeePence: number;          // Total fees (FoulPay + GoCardless)
  totalChargePence: number;       // Amount charged to player (depends on absorbFees)
  appFeePence: number;            // Amount sent as app_fee to GoCardless (FoulPay fee)
  netWalletCreditPence: number;   // Amount credited to team wallet after fees
}

/**
 * Calculate FoulPay fee based on tiered structure:
 * - Subtotal < £10.00 (1000 pence): FoulPay Fee = 2% flat
 * - Subtotal >= £10.00 (1000 pence): FoulPay Fee = 1% + 10p
 * 
 * @param subtotalPence - Subtotal in pence (integer)
 * @returns FoulPay fee in pence (integer, rounded up)
 */
export function calculateFoulPayFee(subtotalPence: number): number {
  if (subtotalPence < 1000) {
    // 2% flat for subtotals under £10.00
    return Math.ceil(subtotalPence * 0.02);
  } else {
    // 1% + 10p for subtotals £10.00 or more
    return Math.ceil(subtotalPence * 0.01) + 10;
  }
}

/**
 * Calculate GoCardless IBP fee (flat 1% of subtotal)
 * 
 * @param subtotalPence - Subtotal in pence
 * @returns GoCardless fee in pence (integer, rounded up)
 */
export function calculateGoCardlessFee(subtotalPence: number): number {
  return Math.ceil(subtotalPence * 0.01);
}

/**
 * Calculate all fees and totals based on whether team absorbs fees
 * 
 * @param subtotalPence - Total fine amount in pence
 * @param absorbFees - If true, team absorbs fees (player pays subtotal only). If false, player pays fees.
 * @returns Complete fee breakdown
 */
export function calculatePaymentFees(
  subtotalPence: number, 
  absorbFees: boolean
): FeeCalculation {
  // Calculate fees based on the subtotal
  const foulPayFeePence = calculateFoulPayFee(subtotalPence);
  const goCardlessFeePence = calculateGoCardlessFee(subtotalPence);
  const totalFeePence = foulPayFeePence + goCardlessFeePence;
  
  if (absorbFees) {
    // Team absorbs fees - player pays exact subtotal
    const totalChargePence = subtotalPence;
    
    // Team wallet receives subtotal minus all fees
    const netWalletCreditPence = subtotalPence - totalFeePence;
    
    return {
      subtotalPence,
      foulPayFeePence,
      goCardlessFeePence,
      totalFeePence,
      totalChargePence,
      appFeePence: foulPayFeePence, // FoulPay fee is still sent as app_fee
      netWalletCreditPence,
    };
  } else {
    // Player pays fees on top of subtotal
    const totalChargePence = subtotalPence + totalFeePence;
    
    // Team wallet receives the full subtotal (player covered all fees)
    const netWalletCreditPence = subtotalPence;
    
    return {
      subtotalPence,
      foulPayFeePence,
      goCardlessFeePence,
      totalFeePence,
      totalChargePence,
      appFeePence: foulPayFeePence, // FoulPay fee sent as app_fee
      netWalletCreditPence,
    };
  }
}

/**
 * Format pence to GBP currency string
 * 
 * @param pence - Amount in pence
 * @returns Formatted currency string (e.g., "£2.06")
 */
export function formatPenceToPounds(pence: number): string {
  const pounds = pence / 100;
  return `£${pounds.toFixed(2)}`;
}

/**
 * Convert pounds (decimal) to pence (integer)
 * 
 * @param pounds - Amount in pounds (e.g., 2.50)
 * @returns Amount in pence (e.g., 250)
 */
export function poundsToPence(pounds: number | string): number {
  const numPounds = typeof pounds === 'string' ? parseFloat(pounds) : pounds;
  return Math.round(numPounds * 100);
}

/**
 * Calculate fees for multiple fines being paid together
 * 
 * @param fineAmountsPence - Array of fine amounts in pence
 * @param absorbFees - If true, team absorbs fees (player pays subtotal only)
 * @returns Fee calculation for the combined total
 */
export function calculateBulkPaymentFees(
  fineAmountsPence: number[],
  absorbFees: boolean
): FeeCalculation {
  const subtotalPence = fineAmountsPence.reduce((sum, amount) => sum + amount, 0);
  return calculatePaymentFees(subtotalPence, absorbFees);
}
