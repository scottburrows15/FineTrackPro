import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMyFines, useTeamInfo } from '../../hooks/useApi';

export default function PlayerDashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: fines, isLoading: finesLoading, refetch: refetchFines } = useMyFines();
  const { data: team, isLoading: teamLoading, refetch: refetchTeam } = useTeamInfo();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFines(), refetchTeam()]);
    setRefreshing(false);
  }, [refetchFines, refetchTeam]);

  const unpaidFines = fines?.filter(f => f.paymentStatus === 'unpaid') || [];
  const pendingFines = fines?.filter(f => f.paymentStatus === 'pending_payment') || [];
  const paidFines = fines?.filter(f => f.paymentStatus === 'paid') || [];

  const totalOwed = unpaidFines.reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const pendingAmount = pendingFines.reduce((sum, f) => sum + parseFloat(f.amount), 0);

  if (finesLoading || teamLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.username}>{user?.username || 'Player'}</Text>
        {team && <Text style={styles.teamName}>{team.name}</Text>}
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.owedCard]}>
          <Text style={styles.statLabel}>Total Owed</Text>
          <Text style={styles.statValue}>£{totalOwed.toFixed(2)}</Text>
          <Text style={styles.statCount}>{unpaidFines.length} fine{unpaidFines.length !== 1 ? 's' : ''}</Text>
        </View>

        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>£{pendingAmount.toFixed(2)}</Text>
          <Text style={styles.statCount}>{pendingFines.length} payment{pendingFines.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={[styles.statCard, styles.paidCard, styles.fullWidth]}>
        <Text style={styles.statLabel}>Paid This Month</Text>
        <Text style={styles.statValue}>{paidFines.length}</Text>
        <Text style={styles.statCount}>fines cleared</Text>
      </View>

      {unpaidFines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Fines</Text>
          {unpaidFines.slice(0, 3).map(fine => (
            <View key={fine.id} style={styles.fineItem}>
              <View>
                <Text style={styles.fineCategory}>{fine.categoryName}</Text>
                {fine.subcategoryName && (
                  <Text style={styles.fineSubcategory}>{fine.subcategoryName}</Text>
                )}
              </View>
              <Text style={styles.fineAmount}>£{parseFloat(fine.amount).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
  greeting: {
    fontSize: 16,
    color: '#94a3b8',
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  teamName: {
    fontSize: 14,
    color: '#22c55e',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
  },
  fullWidth: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  owedCard: {
    backgroundColor: '#dc2626',
  },
  pendingCard: {
    backgroundColor: '#f59e0b',
  },
  paidCard: {
    backgroundColor: '#22c55e',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  statCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  fineItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fineCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fineSubcategory: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  fineAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
  },
});
