export interface User {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'admin';
  teamId: string | null;
  profileImageUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  inviteCode: string;
  passFeesToPlayer: boolean;
  createdAt: string;
}

export interface Fine {
  id: string;
  playerId: string;
  teamId: string;
  categoryId: string;
  subcategoryId: string | null;
  amount: string;
  reason: string | null;
  isPaid: boolean;
  paymentStatus: 'unpaid' | 'pending_payment' | 'paid';
  paidAt: string | null;
  createdAt: string;
  gocardlessBillingRequestId: string | null;
}

export interface FineWithDetails extends Fine {
  playerName: string;
  categoryName: string;
  subcategoryName: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface WalletData {
  availableBalance: number;
  availableBalancePounds: string;
  pendingBalance: number;
  pendingBalancePounds: string;
}

export interface FundsSummary {
  inPot: number;
  settled: number;
  pendingPaymentsCount: number;
}

export interface TeamStats {
  totalPlayers: number;
  outstandingFines: string;
  paidFines: string;
  unpaidFinesCount: number;
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export interface PendingPayment {
  id: string;
  billingRequestId: string;
  playerName: string;
  amount: number;
  fineCount: number;
  status: string;
  createdAt: string;
}
