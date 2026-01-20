import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useFundsSummary, useTeamStats, useTeamInfo } from '../../hooks/useApi';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: fundsSummary, isLoading: fundsLoading, refetch: refetchFunds } = useFundsSummary();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useTeamStats();
  const { data: team, refetch: refetchTeam } = useTeamInfo();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFunds(), refetchStats(), refetchTeam()]);
    setRefreshing(false);
  }, [refetchFunds, refetchStats, refetchTeam]);

  const isLoading = fundsLoading || statsLoading;

  if (isLoading) {
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
        <Text style={styles.greeting}>Admin Dashboard</Text>
        <Text style={styles.teamName}>{team?.name}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.inPotCard]}>
          <Text style={styles.statLabel}>In Pot</Text>
          <Text style={styles.statValue}>£{(fundsSummary?.inPot || 0).toFixed(2)}</Text>
          <Text style={styles.statHint}>Available balance</Text>
        </View>

        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>£{(fundsSummary?.settled || 0).toFixed(2)}</Text>
          <Text style={styles.statHint}>{fundsSummary?.pendingPaymentsCount || 0} payments</Text>
        </View>

        <View style={[styles.statCard, styles.outstandingCard]}>
          <Text style={styles.statLabel}>Outstanding</Text>
          <Text style={styles.statValue}>£{stats?.outstandingFines || '0.00'}</Text>
          <Text style={styles.statHint}>{stats?.unpaidFinesCount || 0} fines</Text>
        </View>

        <View style={[styles.statCard, styles.playersCard]}>
          <Text style={styles.statLabel}>Players</Text>
          <Text style={styles.statValue}>{stats?.totalPlayers || 0}</Text>
          <Text style={styles.statHint}>Team members</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📝 Issue Fine</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>👥 Manage Team</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>💰 View Wallet</Text>
        </TouchableOpacity>
      </View>

      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {stats.recentActivity.slice(0, 5).map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <Text style={styles.activityMessage}>{activity.message}</Text>
              <Text style={styles.activityTime}>
                {new Date(activity.timestamp).toLocaleDateString()}
              </Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  teamName: {
    fontSize: 16,
    color: '#22c55e',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    padding: 20,
  },
  inPotCard: {
    backgroundColor: '#0ea5e9',
  },
  pendingCard: {
    backgroundColor: '#8b5cf6',
  },
  outstandingCard: {
    backgroundColor: '#dc2626',
  },
  playersCard: {
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
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  statHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  activityItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  activityMessage: {
    fontSize: 14,
    color: '#fff',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});
