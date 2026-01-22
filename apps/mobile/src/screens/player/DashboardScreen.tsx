import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useMyFines, useTeamInfo, useNotifications } from '../../hooks/useApi';
import { Card, Button, StatCard } from '../../components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function PlayerDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: fines, isLoading: finesLoading, refetch: refetchFines } = useMyFines();
  const { data: team, refetch: refetchTeam } = useTeamInfo();
  const { data: notifications } = useNotifications();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFines(), refetchTeam()]);
    setRefreshing(false);
  }, [refetchFines, refetchTeam]);

  const unpaidFines = fines?.filter(f => f.paymentStatus === 'unpaid') || [];
  const pendingFines = fines?.filter(f => f.paymentStatus === 'pending_payment') || [];
  const paidFines = fines?.filter(f => f.paymentStatus === 'paid') || [];

  const totalOwed = unpaidFines.reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const totalPaid = paidFines.reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const firstName = user?.username?.split(' ')[0] || 'Player';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Hi {firstName}! 👋</Text>
              <Text style={styles.subGreeting}>
                {totalOwed > 0 
                  ? `You have £${totalOwed.toFixed(2)} in outstanding fines`
                  : "You're all caught up!"}
              </Text>
            </View>
            {totalOwed > 0 && (
              <Button 
                onPress={() => navigation.navigate('Fines')}
                variant="primary"
                size="sm"
              >
                Pay £{totalOwed.toFixed(2)}
              </Button>
            )}
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: colors.primary[600] }]}>
            <Text style={styles.statLabel}>Total Paid</Text>
            <Text style={styles.statValue}>£{totalPaid.toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.red[600] }]}>
            <Text style={styles.statLabel}>Outstanding</Text>
            <Text style={styles.statValue}>£{totalOwed.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: colors.purple[600] }]}>
            <Text style={styles.statLabel}>League Position</Text>
            <Text style={styles.statValue}>#-</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.amber[500] }]}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{pendingFines.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Fines')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>View Fines</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Stats')}
          >
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionText}>My Stats</Text>
          </TouchableOpacity>
        </View>
      </View>

      {unpaidFines.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Fines</Text>
          {unpaidFines.slice(0, 3).map(fine => (
            <Card key={fine.id} style={styles.fineCard}>
              <View style={styles.fineRow}>
                <View>
                  <Text style={styles.fineCategory}>{fine.categoryName}</Text>
                  {fine.subcategoryName && (
                    <Text style={styles.fineSubcategory}>{fine.subcategoryName}</Text>
                  )}
                </View>
                <Text style={styles.fineAmount}>£{parseFloat(fine.amount).toFixed(2)}</Text>
              </View>
            </Card>
          ))}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  headerGradient: {
    backgroundColor: colors.slate[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },
  greeting: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subGreeting: {
    fontSize: fontSize.sm,
    color: colors.slate[300],
  },
  statsGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  quickActions: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.slate[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.slate[700],
    minHeight: 80,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  recentSection: {
    padding: spacing.lg,
  },
  fineCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  fineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fineCategory: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  fineSubcategory: {
    fontSize: fontSize.sm,
    color: colors.slate[400],
    marginTop: 2,
  },
  fineAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.red[500],
  },
  bottomSpacer: {
    height: 100,
  },
});
