import { storage } from "./storage";

export interface WalletStats {
  pendingAmountPence: number;
  paidNetAmountPence: number;
  availableBalancePence: number;
  pendingBalancePence: number;
}

export interface PaymentStats {
  pendingPaymentsCount: number;
  pendingPaymentsTotal: number;
  completedPaymentsCount: number;
  completedPaymentsTotal: number;
}

export async function getTeamWalletStats(teamId: string): Promise<WalletStats> {
  const [wallet, pendingFinesTotal, paidNetTotal] = await Promise.all([
    storage.getTeamWallet(teamId),
    storage.getPendingPaymentFinesTotal(teamId),
    storage.getPaidFinesNetTotal(teamId),
  ]);

  return {
    pendingAmountPence: pendingFinesTotal,
    paidNetAmountPence: paidNetTotal,
    availableBalancePence: wallet?.availableBalance || 0,
    pendingBalancePence: wallet?.pendingBalance || 0,
  };
}

export async function getPaymentDashboardStats(teamId: string): Promise<PaymentStats> {
  const [pendingRequests, paymentHistory] = await Promise.all([
    storage.getPendingGcBillingRequests(teamId),
    storage.getPaymentHistory(teamId),
  ]);

  const pendingTotal = pendingRequests.reduce((sum, req) => sum + (req.totalCharged || 0), 0);
  const completedTotal = paymentHistory.reduce((sum, ph) => {
    const netAmount = typeof ph.netAmount === 'string' ? parseFloat(ph.netAmount) : ph.netAmount;
    return sum + Math.round((netAmount || 0) * 100);
  }, 0);

  return {
    pendingPaymentsCount: pendingRequests.length,
    pendingPaymentsTotal: pendingTotal,
    completedPaymentsCount: paymentHistory.length,
    completedPaymentsTotal: completedTotal,
  };
}

export async function addPendingToWallet(teamId: string, amountPence: number): Promise<void> {
  await storage.addPendingBalance(teamId, amountPence);
}

export async function confirmPaymentToWallet(
  teamId: string, 
  pendingAmountPence: number, 
  netAmountPence: number
): Promise<void> {
  await storage.confirmPendingBalance(teamId, pendingAmountPence);
  await storage.creditWallet(teamId, netAmountPence);
}

export async function revertPendingFromWallet(teamId: string, amountPence: number): Promise<void> {
  const wallet = await storage.getTeamWallet(teamId);
  if (wallet && wallet.pendingBalance > 0) {
    const newPending = Math.max(0, wallet.pendingBalance - amountPence);
    await storage.confirmPendingBalance(teamId, wallet.pendingBalance - newPending);
  }
}

export function formatPenceToPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}
