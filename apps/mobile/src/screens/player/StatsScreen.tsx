import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useMyFines, useTeamInfo } from '../../hooks/useApi';
import { Card } from '../../components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function StatsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: fines, refetch: refetchFines } = useMyFines();
  const { data: team, refetch: refetchTeam } = useTeamInfo();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFines(), refetchTeam()]);
    setRefreshing(false);
  }, [refetchFines, refetchTeam]);

  const unpaidFines = fines?.filter(f => f.paymentStatus === 'unpaid') || [];
  const paidFines = fines?.filter(f => f.paymentStatus === 'paid') || [];
  const totalFines = fines?.length || 0;
  const totalOwed = unpaidFines.reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const totalPaid = paidFines.reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const categoryBreakdown = fines?.reduce((acc, fine) => {
    const category = fine.categoryName || 'Unknown';
    if (!acc[category]) {
      acc[category] = { count: 0, amount: 0 };
    }
    acc[category].count++;
    acc[category].amount += parseFloat(fine.amount);
    return acc;
  }, {} as Record<string, { count: number; amount: number }>) || {};

  const sortedCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1].amount - a[1].amount);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Stats</Text>
        <Text style={styles.subtitle}>{team?.name || 'Team'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.blue[600] }]}>
          <Text style={styles.statLabel}>Total Fines</Text>
          <Text style={styles.statValue}>{totalFines}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.red[600] }]}>
          <Text style={styles.statLabel}>Outstanding</Text>
          <Text style={styles.statValue}>£{totalOwed.toFixed(2)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.primary[600] }]}>
          <Text style={styles.statLabel}>Total Paid</Text>
          <Text style={styles.statValue}>£{totalPaid.toFixed(2)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.purple[600] }]}>
          <Text style={styles.statLabel}>League Pos</Text>
          <Text style={styles.statValue}>#-</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fine Breakdown by Category</Text>
        {sortedCategories.length > 0 ? (
          sortedCategories.map(([category, data]) => (
            <Card key={category} style={styles.categoryCard}>
              <View style={styles.categoryRow}>
                <View>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryCount}>{data.count} fine{data.count !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={styles.categoryAmount}>£{data.amount.toFixed(2)}</Text>
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No fines yet - keep it up!</Text>
          </Card>
        )}
      </View>

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
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
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
  section: {
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  categoryCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  categoryCount: {
    fontSize: fontSize.xs,
    color: colors.slate[400],
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.amber[500],
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.slate[400],
  },
  bottomSpacer: {
    height: 100,
  },
});
