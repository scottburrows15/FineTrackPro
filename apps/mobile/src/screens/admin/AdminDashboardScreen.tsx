import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFundsSummary, useTeamStats, useTeamFines, useTeamInfo, useMarkFinePaid, useDeleteFine } from '../../hooks/useApi';
import { Card, Badge, Button } from '../../components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import type { FineWithDetails } from '../../types';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');

  const { data: fundsSummary, isLoading: fundsLoading, refetch: refetchFunds } = useFundsSummary();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useTeamStats();
  const { data: fines, isLoading: finesLoading, refetch: refetchFines } = useTeamFines();
  const { data: team, refetch: refetchTeam } = useTeamInfo();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFunds(), refetchStats(), refetchFines(), refetchTeam()]);
    setRefreshing(false);
  }, [refetchFunds, refetchStats, refetchFines, refetchTeam]);

  const filteredFines = useMemo(() => {
    let result = fines || [];
    
    if (statusFilter === 'unpaid') {
      result = result.filter(f => !f.isPaid);
    } else if (statusFilter === 'paid') {
      result = result.filter(f => f.isPaid);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => {
        const playerName = f.playerName?.toLowerCase() || '';
        return playerName.includes(query);
      });
    }

    return result;
  }, [fines, statusFilter, searchQuery]);

  const unpaidCount = fines?.filter(f => !f.isPaid).length || 0;

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `£${num.toFixed(2)}`;
  };

  const isLoading = fundsLoading || statsLoading || finesLoading;

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
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>{team?.name || 'Your Team'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.indigo[500] }]}>
          <Text style={styles.statLabel}>Total Players</Text>
          <Text style={styles.statValue}>{stats?.totalPlayers || 0}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.amber[500] }]}>
          <Text style={styles.statLabel}>Outstanding</Text>
          <Text style={styles.statValue}>{formatCurrency(stats?.outstandingFines || 0)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.rose[500] }]}>
          <Text style={styles.statLabel}>Unpaid Fines</Text>
          <Text style={styles.statValue}>{unpaidCount}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.cyan[500] }]}>
          <Text style={styles.statLabel}>In Pot</Text>
          <Text style={styles.statValue}>{formatCurrency(fundsSummary?.inPot || 0)}</Text>
        </View>
      </View>

      <Card style={styles.shareCard}>
        <View style={styles.shareRow}>
          <View>
            <Text style={styles.shareTitle}>Invite Players</Text>
            <Text style={styles.shareSubtitle}>Share your team code</Text>
          </View>
          <View style={styles.inviteCode}>
            <Text style={styles.inviteCodeText}>{team?.inviteCode || '---'}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fines Management</Text>
          <Button 
            size="sm" 
            onPress={() => navigation.navigate('IssueFine')}
          >
            + Issue Fine
          </Button>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search players..."
            placeholderTextColor={colors.slate[500]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          {(['all', 'unpaid', 'paid'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, statusFilter === filter && styles.filterButtonActive]}
              onPress={() => setStatusFilter(filter)}
            >
              <Text style={[styles.filterText, statusFilter === filter && styles.filterTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.resultCount}>
          {filteredFines.length} fine{filteredFines.length !== 1 ? 's' : ''} found
        </Text>

        {filteredFines.slice(0, 10).map(fine => (
          <FineCard key={fine.id} fine={fine} onRefresh={refetchFines} />
        ))}

        {filteredFines.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No fines found</Text>
          </Card>
        )}

        {filteredFines.length > 10 && (
          <Text style={styles.moreText}>
            +{filteredFines.length - 10} more fines
          </Text>
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function FineCard({ fine, onRefresh }: { fine: FineWithDetails; onRefresh: () => void }) {
  const markPaidMutation = useMarkFinePaid();
  const deleteMutation = useDeleteFine();

  const handleMarkPaid = () => {
    Alert.alert(
      'Mark as Paid',
      `Mark ${fine.playerName}'s fine as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            markPaidMutation.mutate(fine.id, {
              onSuccess: () => {
                Alert.alert('Success', 'Fine marked as paid');
                onRefresh();
              },
              onError: (error: any) => {
                Alert.alert('Error', error.message || 'Failed to mark fine as paid');
              },
            });
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Fine',
      'Are you sure you want to delete this fine?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            deleteMutation.mutate(fine.id, {
              onSuccess: () => {
                Alert.alert('Success', 'Fine deleted');
                onRefresh();
              },
              onError: (error: any) => {
                Alert.alert('Error', error.message || 'Failed to delete fine');
              },
            });
          },
        },
      ]
    );
  };

  const isProcessing = markPaidMutation.isPending || deleteMutation.isPending;

  return (
    <Card style={styles.fineCard}>
      <View style={styles.fineHeader}>
        <Text style={styles.playerName}>{fine.playerName}</Text>
        <Badge variant={fine.isPaid ? 'success' : 'danger'}>
          {fine.isPaid ? 'Paid' : 'Unpaid'}
        </Badge>
      </View>
      <Text style={styles.fineCategory}>
        {fine.subcategoryName || fine.categoryName} · £{parseFloat(fine.amount).toFixed(2)}
      </Text>
      <Text style={styles.fineDate}>
        {new Date(fine.createdAt).toLocaleDateString()}
      </Text>
      
      {!fine.isPaid && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionButton, isProcessing && styles.disabledButton]} 
            onPress={handleMarkPaid}
            disabled={isProcessing}
          >
            <Text style={styles.actionButtonText}>
              {markPaidMutation.isPending ? '...' : '✓ Paid'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton, isProcessing && styles.disabledButton]} 
            onPress={handleDelete}
            disabled={isProcessing}
          >
            <Text style={styles.deleteButtonText}>
              {deleteMutation.isPending ? '...' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
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
    color: colors.primary[500],
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    width: '47%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: fontWeight.medium,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.xs,
  },
  shareCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  shareSubtitle: {
    fontSize: fontSize.xs,
    color: colors.slate[400],
    marginTop: 2,
  },
  inviteCode: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  inviteCodeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
    fontFamily: 'monospace',
  },
  section: {
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.slate[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.white,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.slate[800],
  },
  filterButtonActive: {
    backgroundColor: colors.primary[600],
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.slate[400],
    fontWeight: fontWeight.medium,
  },
  filterTextActive: {
    color: colors.white,
  },
  resultCount: {
    fontSize: fontSize.xs,
    color: colors.slate[500],
    marginBottom: spacing.md,
  },
  fineCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  fineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  playerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  fineCategory: {
    fontSize: fontSize.sm,
    color: colors.slate[300],
  },
  fineDate: {
    fontSize: fontSize.xs,
    color: colors.slate[500],
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  deleteButton: {
    backgroundColor: colors.red[600],
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.slate[400],
  },
  moreText: {
    fontSize: fontSize.sm,
    color: colors.slate[500],
    textAlign: 'center',
    marginTop: spacing.md,
  },
  bottomSpacer: {
    height: 100,
  },
});
