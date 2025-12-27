/**
 * FoulPay Fee Calculation Helper
 * All calculations use integer pence to avoid floating-point precision issues
 */

export interface FeeCalculation {
  fineAmountPence: number;        // Original fine amount in pence
  foulPayFeePence: number;        // FoulPay platform fee in pence
  goCardlessFeePence: number;     // GoCardless 1% fee in pence
  totalFeePence: number;          // Total fees (FoulPay + GoCardless)
  totalChargePence: number;       // Amount charged to player (depends on passFeesToPlayer)
  netWalletCreditPence: number;   // Amount credited to team wallet after fees
}

/**
 * Calculate FoulPay fee based on tiered structure:
 * - Fine <= £10.00 (1000 pence): FoulPay Fee = 2% flat
 * - Fine > £10.00 (1000 pence): FoulPay Fee = 1% + 10p
 * 
 * @param fineAmountPence - Fine amount in pence (integer)
 * @returns FoulPay fee in pence (integer, rounded up)
 */
export function calculateFoulPayFee(fineAmountPence: number): number {
  if (fineAmountPence <= 1000) {
    // 2% flat for fines £10.00 or less
    return Math.ceil(fineAmountPence * 0.02);
  } else {
    // 1% + 10p for fines over £10.00
    return Math.ceil(fineAmountPence * 0.01) + 10;
  }
}

/**
 * Calculate GoCardless fee (1% of the transaction amount)
 * 
 * @param amountPence - Amount being charged in pence
 * @returns GoCardless fee in pence (integer, rounded up)
 */
export function calculateGoCardlessFee(amountPence: number): number {
  return Math.ceil(amountPence * 0.01);
}

/**
 * Calculate all fees and totals based on whether fees are passed to the player
 * 
 * GoCardless charges 1% on the TOTAL transaction amount, so we need to solve for T:
 * T = subtotal + 0.01 * T
 * T - 0.01T = subtotal
 * 0.99T = subtotal
 * T = subtotal / 0.99 (rounded up)
 * 
 * @param fineAmountPence - Total fine amount in pence
 * @param passFeesToPlayer - If true, player pays fees on top of fine. If false, fees deducted from fine.
 * @returns Complete fee breakdown
 */
export function calculatePaymentFees(
  fineAmountPence: number, 
  passFeesToPlayer: boolean
): FeeCalculation {
  // Calculate FoulPay fee based on the original fine amount
  const foulPayFeePence = calculateFoulPayFee(fineAmountPence);
  
  if (passFeesToPlayer) {
    // Player pays fees on top of fine
    // Subtotal = fine + FoulPay fee (before GoCardless fee)
    const subtotal = fineAmountPence + foulPayFeePence;
    
    // GoCardless charges 1% on the total, so we solve for total:
    // T = subtotal / 0.99 (rounded up to cover the fee)
    const totalChargePence = Math.ceil(subtotal / 0.99);
    
    // GoCardless fee is the difference
    const goCardlessFeePence = totalChargePence - subtotal;
    
    const totalFeePence = foulPayFeePence + goCardlessFeePence;
    
    // Team wallet receives the full fine amount (player covered all fees)
    const netWalletCreditPence = fineAmountPence;
    
    return {
      fineAmountPence,
      foulPayFeePence,
      goCardlessFeePence,
      totalFeePence,
      totalChargePence,
      netWalletCreditPence,
    };
  } else {
    // Team absorbs fees - player pays exact fine amount
    const totalChargePence = fineAmountPence;
    
    // GoCardless fee is 1% of what the player pays
    const goCardlessFeePence = calculateGoCardlessFee(fineAmountPence);
    
    const totalFeePence = foulPayFeePence + goCardlessFeePence;
    
    // Team wallet receives fine minus all fees
    const netWalletCreditPence = fineAmountPence - totalFeePence;
    
    return {
      fineAmountPence,
      foulPayFeePence,
      goCardlessFeePence,
      totalFeePence,
      totalChargePence,
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
 * @param passFeesToPlayer - If true, player pays fees on top
 * @returns Fee calculation for the combined total
 */
export function calculateBulkPaymentFees(
  fineAmountsPence: number[],
  passFeesToPlayer: boolean
): FeeCalculation {
  const totalFineAmountPence = fineAmountsPence.reduce((sum, amount) => sum + amount, 0);
  return calculatePaymentFees(totalFineAmountPence, passFeesToPlayer);
}
