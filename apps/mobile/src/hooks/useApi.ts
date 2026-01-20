import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { API_ENDPOINTS } from '../config/api';
import type { 
  FineWithDetails, 
  Team, 
  FundsSummary, 
  WalletData, 
  TeamStats,
  Notification,
  PendingPayment 
} from '../types';

export function useMyFines() {
  return useQuery({
    queryKey: ['fines', 'my'],
    queryFn: () => apiClient.get<FineWithDetails[]>(API_ENDPOINTS.fines.my),
  });
}

export function useTeamFines() {
  return useQuery({
    queryKey: ['fines', 'team'],
    queryFn: () => apiClient.get<FineWithDetails[]>(API_ENDPOINTS.fines.team),
  });
}

export function useTeamInfo() {
  return useQuery({
    queryKey: ['team', 'info'],
    queryFn: () => apiClient.get<Team>(API_ENDPOINTS.teams.info),
  });
}

export function useFundsSummary() {
  return useQuery({
    queryKey: ['admin', 'funds-summary'],
    queryFn: () => apiClient.get<FundsSummary>(API_ENDPOINTS.admin.fundsSummary),
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ['admin', 'wallet'],
    queryFn: () => apiClient.get<WalletData>(API_ENDPOINTS.wallet.info),
  });
}

export function useTeamStats() {
  return useQuery({
    queryKey: ['stats', 'team'],
    queryFn: () => apiClient.get<TeamStats>(API_ENDPOINTS.stats.team),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get<Notification[]>(API_ENDPOINTS.notifications.list),
  });
}

export function usePendingPayments() {
  return useQuery({
    queryKey: ['payments', 'pending'],
    queryFn: () => apiClient.get<PendingPayment[]>(API_ENDPOINTS.payments.pending),
  });
}

export function usePayFines() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (fineIds: string[]) =>
      apiClient.post<{ billingRequestFlowUrl: string }>(
        API_ENDPOINTS.payments.createIntent,
        { fineIds }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useSimulatePaymentSuccess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (billingRequestId: string) =>
      apiClient.post(`/api/admin/payments/${billingRequestId}/simulate-success`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useSimulatePaymentCancel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (billingRequestId: string) =>
      apiClient.post(`/api/admin/payments/${billingRequestId}/simulate-cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useClearAllPending() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.post('/api/admin/payments/clear-all-pending'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}
