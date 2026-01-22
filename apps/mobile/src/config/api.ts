export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://7568e0fe-6547-4521-a0e4-43b4a2e86806-00-7zuqx02rs3f8.kirk.replit.dev';

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    user: '/api/auth/user',
  },
  fines: {
    my: '/api/fines/my',
    team: '/api/fines/team',
  },
  teams: {
    info: '/api/team/info',
    list: '/api/user/teams',
    active: '/api/user/active-team',
  },
  payments: {
    createIntent: '/api/payments/create-intent',
    pending: '/api/admin/payments/pending',
    stats: '/api/admin/payments/stats',
  },
  wallet: {
    info: '/api/admin/wallet',
    withdraw: '/api/admin/wallet/withdraw',
  },
  notifications: {
    list: '/api/notifications',
    counts: '/api/notifications/counts',
  },
  stats: {
    team: '/api/stats/team',
  },
  admin: {
    fundsSummary: '/api/admin/funds-summary',
  },
} as const;
