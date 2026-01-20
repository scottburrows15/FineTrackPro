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
      const result = await payMutation.mutateAsync(Array.from(selectedFines));
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
      >
        <View style={styles.fineContent}>
          <View style={styles.fineHeader}>
            <Text style={[styles.fineCategory, isPending && styles.pendingText]}>
              {item.categoryName}
            </Text>
            {isPending && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
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
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Fines</Text>
        <Text style={styles.subtitle}>
          {unpaidFines.length} unpaid • {pendingFines.length} pending • {paidFines.length} paid
        </Text>
      </View>

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
          <FlatList
            data={unpaidFines}
            renderItem={({ item }) => renderFineItem({ item })}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      {unpaidFines.length === 0 && pendingFines.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>All Clear!</Text>
          <Text style={styles.emptySubtitle}>You have no outstanding fines</Text>
        </View>
      )}

      {selectedFines.size > 0 && (
        <View style={styles.payBar}>
          <View>
            <Text style={styles.payBarLabel}>
              {selectedFines.size} fine{selectedFines.size > 1 ? 's' : ''} selected
            </Text>
            <Text style={styles.payBarTotal}>£{selectedTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.payButton, payMutation.isPending && styles.payButtonDisabled]}
            onPress={handlePaySelected}
            disabled={payMutation.isPending}
          >
            {payMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>Pay Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectAllText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  fineItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pendingFineItem: {
    backgroundColor: '#1e293b',
    opacity: 0.6,
  },
  selectedFineItem: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  fineContent: {
    flex: 1,
  },
  fineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fineCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pendingText: {
    color: '#64748b',
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  fineSubcategory: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  fineDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  fineRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  fineAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
  },
  pendingAmount: {
    color: '#f59e0b',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkmark: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  payBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    padding: 16,
    paddingBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payBarLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  payBarTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  payButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
