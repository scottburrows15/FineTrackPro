import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  useWallet,
  usePendingPayments,
  useSimulatePaymentSuccess,
  useSimulatePaymentCancel,
  useClearAllPending,
} from '../../hooks/useApi';
import { Card, Badge, Button } from '../../components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import type { PendingPayment } from '../../types';

export default function WalletScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWallet();
  const { data: pendingPayments, isLoading: pendingLoading, refetch: refetchPending } = usePendingPayments();

  const simulateSuccess = useSimulatePaymentSuccess();
  const simulateCancel = useSimulatePaymentCancel();
  const clearAllPending = useClearAllPending();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchPending()]);
    setRefreshing(false);
  }, [refetchWallet, refetchPending]);

  const handleSimulateSuccess = (payment: PendingPayment) => {
    Alert.alert(
      'Simulate Success',
      `Mark payment from ${payment.playerName} as successful?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => simulateSuccess.mutate(payment.billingRequestId),
        },
      ]
    );
  };

  const handleSimulateCancel = (payment: PendingPayment) => {
    Alert.alert(
      'Cancel Payment',
      `Cancel payment from ${payment.playerName}? Fines will be reset to unpaid.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => simulateCancel.mutate(payment.billingRequestId),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Pending',
      'This will reset all pending payments and orphaned fines. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAllPending.mutate(),
        },
      ]
    );
  };

  const isLoading = walletLoading || pendingLoading;

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Team Wallet</Text>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Available</Text>
            <Text style={styles.balanceValue}>{wallet?.availableBalancePounds || '£0.00'}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Pending</Text>
            <Text style={[styles.balanceValue, styles.pendingValue]}>
              {wallet?.pendingBalancePounds || '£0.00'}
            </Text>
          </View>
        </View>
      </View>

      {pendingPayments && pendingPayments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Pending Payments ({pendingPayments.length})
            </Text>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearAll}
              disabled={clearAllPending.isPending}
            >
              {clearAllPending.isPending ? (
                <ActivityIndicator size="small" color={colors.red[500]} />
              ) : (
                <Text style={styles.clearAllText}>Clear All</Text>
              )}
            </TouchableOpacity>
          </View>

          {pendingPayments.map((payment) => (
            <Card key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentPlayer}>{payment.playerName}</Text>
                <Text style={styles.paymentDetails}>
                  {payment.fineCount} fine{payment.fineCount > 1 ? 's' : ''} • 
                  £{(payment.amount / 100).toFixed(2)}
                </Text>
              </View>

              <View style={styles.paymentActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.successBtn]}
                  onPress={() => handleSimulateSuccess(payment)}
                  disabled={simulateSuccess.isPending}
                >
                  <Text style={styles.actionBtnText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={() => handleSimulateCancel(payment)}
                  disabled={simulateCancel.isPending}
                >
                  <Text style={styles.actionBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      {(!pendingPayments || pendingPayments.length === 0) && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyTitle}>No Pending Payments</Text>
          <Text style={styles.emptySubtitle}>
            Payments will appear here when players initiate bank transfers
          </Text>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[900],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.slate[900],
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  balanceCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  balanceLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    color: colors.white,
    marginTop: spacing.sm,
  },
  pendingValue: {
    opacity: 0.9,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.amber[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.red[600],
  },
  clearAllText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.red[500],
  },
  paymentCard: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.amber[500],
  },
  paymentInfo: {
    flex: 1,
  },
  paymentPlayer: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  paymentDetails: {
    fontSize: fontSize.sm,
    color: colors.slate[400],
    marginTop: spacing.xs,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBtn: {
    backgroundColor: colors.primary[500],
  },
  cancelBtn: {
    backgroundColor: colors.red[600],
  },
  actionBtnText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.slate[400],
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
});
