import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useMyFines, usePayFines } from '../../hooks/useApi';
import { Card, Badge, Button } from '../../components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import type { FineWithDetails } from '../../types';

export default function FinesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFines, setSelectedFines] = useState<Set<string>>(new Set());
  
  const { data: fines, isLoading, refetch } = useMyFines();
  const payMutation = usePayFines();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const unpaidFines = fines?.filter(f => f.paymentStatus === 'unpaid') || [];
  const pendingFines = fines?.filter(f => f.paymentStatus === 'pending_payment') || [];
  const paidFines = fines?.filter(f => f.paymentStatus === 'paid') || [];

  const toggleFineSelection = (fineId: string) => {
    setSelectedFines(prev => {
      const next = new Set(prev);
      if (next.has(fineId)) {
        next.delete(fineId);
      } else {
        next.add(fineId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedFines(new Set(unpaidFines.map(f => f.id)));
  };

  const clearSelection = () => {
    setSelectedFines(new Set());
  };

  const handlePaySelected = async () => {
    if (selectedFines.size === 0) {
      Alert.alert('No fines selected', 'Please select fines to pay');
      return;
    }

    try {
      await payMutation.mutateAsync(Array.from(selectedFines));
      Alert.alert(
        'Payment Initiated',
        'You will be redirected to complete your bank payment.',
        [{ text: 'OK' }]
      );
      clearSelection();
    } catch (error) {
      Alert.alert('Payment Failed', error instanceof Error ? error.message : 'Please try again');
    }
  };

  const selectedTotal = unpaidFines
    .filter(f => selectedFines.has(f.id))
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const renderFineItem = ({ item, isPending = false }: { item: FineWithDetails; isPending?: boolean }) => {
    const isSelected = selectedFines.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.fineItem,
          isPending && styles.pendingFineItem,
          isSelected && styles.selectedFineItem,
        ]}
        onPress={() => !isPending && toggleFineSelection(item.id)}
        disabled={isPending}
        activeOpacity={0.7}
      >
        <View style={styles.fineContent}>
          <View style={styles.fineHeader}>
            <Text style={[styles.fineCategory, isPending && styles.pendingText]}>
              {item.categoryName}
            </Text>
            {isPending && (
              <Badge variant="warning">Pending</Badge>
            )}
          </View>
          {item.subcategoryName && (
            <Text style={[styles.fineSubcategory, isPending && styles.pendingText]}>
              {item.subcategoryName}
            </Text>
          )}
          <Text style={[styles.fineDate, isPending && styles.pendingText]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.fineRight}>
          <Text style={[styles.fineAmount, isPending && styles.pendingAmount]}>
            £{parseFloat(item.amount).toFixed(2)}
          </Text>
          {!isPending && (
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Fines</Text>
        <Text style={styles.subtitle}>
          {unpaidFines.length} unpaid · {pendingFines.length} pending · {paidFines.length} paid
        </Text>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
        }
        ListHeaderComponent={
          <>
            {pendingFines.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Awaiting Bank Transfer</Text>
                {pendingFines.map(fine => (
                  <View key={fine.id}>
                    {renderFineItem({ item: fine, isPending: true })}
                  </View>
                ))}
              </View>
            )}

            {unpaidFines.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Unpaid Fines</Text>
                  <TouchableOpacity onPress={selectedFines.size > 0 ? clearSelection : selectAll}>
                    <Text style={styles.selectAllText}>
                      {selectedFines.size > 0 ? 'Clear' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {unpaidFines.map(fine => (
                  <View key={fine.id}>
                    {renderFineItem({ item: fine })}
                  </View>
                ))}
              </View>
            )}

            {paidFines.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Paid Fines</Text>
                {paidFines.slice(0, 5).map(fine => (
                  <Card key={fine.id} style={styles.paidFineCard}>
                    <View style={styles.fineRow}>
                      <View>
                        <Text style={styles.paidCategory}>{fine.categoryName}</Text>
                        <Text style={styles.fineDate}>
                          {new Date(fine.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.paidRight}>
                        <Text style={styles.paidAmount}>£{parseFloat(fine.amount).toFixed(2)}</Text>
                        <Badge variant="success">Paid</Badge>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {unpaidFines.length === 0 && pendingFines.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyTitle}>All Clear!</Text>
                <Text style={styles.emptySubtitle}>You have no outstanding fines</Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.listContent}
      />

      {selectedFines.size > 0 && (
        <View style={styles.payBar}>
          <View>
            <Text style={styles.payBarLabel}>
              {selectedFines.size} fine{selectedFines.size > 1 ? 's' : ''} selected
            </Text>
            <Text style={styles.payBarTotal}>£{selectedTotal.toFixed(2)}</Text>
          </View>
          <Button
            onPress={handlePaySelected}
            loading={payMutation.isPending}
            disabled={payMutation.isPending}
          >
            Pay Now
          </Button>
        </View>
      )}
    </View>
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
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.slate[400],
    marginTop: spacing.xs,
  },
  listContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectAllText: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: fontWeight.semibold,
  },
  fineItem: {
    backgroundColor: colors.slate[800],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pendingFineItem: {
    opacity: 0.6,
  },
  selectedFineItem: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  fineContent: {
    flex: 1,
  },
  fineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fineCategory: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  pendingText: {
    color: colors.slate[500],
  },
  fineSubcategory: {
    fontSize: fontSize.sm,
    color: colors.slate[400],
    marginTop: 2,
  },
  fineDate: {
    fontSize: fontSize.xs,
    color: colors.slate[500],
    marginTop: spacing.xs,
  },
  fineRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  fineAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.red[500],
  },
  pendingAmount: {
    color: colors.amber[500],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.slate[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  checkmark: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  paidFineCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  fineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paidCategory: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.slate[300],
  },
  paidRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  paidAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.slate[400],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.slate[400],
    marginTop: spacing.xs,
  },
  payBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.slate[800],
    borderTopWidth: 1,
    borderTopColor: colors.slate[700],
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payBarLabel: {
    fontSize: fontSize.sm,
    color: colors.slate[400],
  },
  payBarTotal: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
