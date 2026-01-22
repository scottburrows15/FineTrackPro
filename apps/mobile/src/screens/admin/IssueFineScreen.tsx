import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useBatchIssueFines } from '../../hooks/useApi';
import { Card, Button } from '../../components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  defaultAmount: string;
}

export default function IssueFineScreen() {
  const navigation = useNavigation<any>();
  const batchIssueMutation = useBatchIssueFines();
  
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'players' | 'category' | 'confirm'>('players');

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['team', 'players'],
    queryFn: () => apiClient.get<Player[]>('/api/team/players'),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get<Category[]>('/api/categories'),
  });

  const { data: subcategories } = useQuery({
    queryKey: ['subcategories'],
    queryFn: () => apiClient.get<Subcategory[]>('/api/subcategories'),
  });

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAll = () => {
    if (players) {
      setSelectedPlayers(players.map(p => p.id));
    }
  };

  const clearSelection = () => {
    setSelectedPlayers([]);
  };

  const handleNext = () => {
    if (step === 'players' && selectedPlayers.length > 0) {
      setStep('category');
    } else if (step === 'category' && selectedSubcategory) {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'category') {
      setStep('players');
    } else if (step === 'confirm') {
      setStep('category');
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = () => {
    if (!selectedSubcategory) {
      Alert.alert('Error', 'Please select a fine category');
      return;
    }
    
    batchIssueMutation.mutate(
      {
        playerIds: selectedPlayers,
        subcategoryId: selectedSubcategory.id,
        amount: amount || selectedSubcategory.defaultAmount,
        description,
      },
      {
        onSuccess: (results) => {
          const succeeded = results.filter(r => r.success).length;
          const failed = results.filter(r => !r.success).length;
          
          if (failed > 0) {
            Alert.alert(
              'Partial Success',
              `${succeeded} fine(s) issued successfully, ${failed} failed`,
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          } else {
            Alert.alert('Success', `${succeeded} fine(s) issued successfully`, [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          }
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to issue fines');
        },
      }
    );
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || '';
  };

  const groupedSubcategories = subcategories?.reduce((acc, sub) => {
    const category = getCategoryName(sub.categoryId);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(sub);
    return acc;
  }, {} as Record<string, Subcategory[]>) || {};

  if (playersLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Issue Fine</Text>
        <Text style={styles.stepIndicator}>Step {step === 'players' ? '1' : step === 'category' ? '2' : '3'} of 3</Text>
      </View>

      <ScrollView style={styles.content}>
        {step === 'players' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Players</Text>
              <TouchableOpacity onPress={selectedPlayers.length > 0 ? clearSelection : selectAll}>
                <Text style={styles.selectAllText}>
                  {selectedPlayers.length > 0 ? 'Clear' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>

            {players?.map(player => (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.playerItem,
                  selectedPlayers.includes(player.id) && styles.playerItemSelected,
                ]}
                onPress={() => togglePlayer(player.id)}
              >
                <View style={styles.playerInfo}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.avatarText}>
                      {player.firstName?.charAt(0) || 'U'}
                    </Text>
                  </View>
                  <Text style={styles.playerName}>
                    {player.firstName} {player.lastName}
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedPlayers.includes(player.id) && styles.checkboxSelected,
                ]}>
                  {selectedPlayers.includes(player.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {(!players || players.length === 0) && (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No players found</Text>
              </Card>
            )}
          </>
        )}

        {step === 'category' && (
          <>
            <Text style={styles.sectionTitle}>Select Fine Type</Text>
            
            {Object.entries(groupedSubcategories).map(([category, subs]) => (
              <View key={category} style={styles.categoryGroup}>
                <Text style={styles.categoryLabel}>{category}</Text>
                {subs.map(sub => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.subcategoryItem,
                      selectedSubcategory?.id === sub.id && styles.subcategoryItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedSubcategory(sub);
                      setAmount(sub.defaultAmount);
                    }}
                  >
                    <Text style={styles.subcategoryName}>{sub.name}</Text>
                    <Text style={styles.subcategoryAmount}>
                      £{parseFloat(sub.defaultAmount).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </>
        )}

        {step === 'confirm' && (
          <>
            <Text style={styles.sectionTitle}>Confirm Fine</Text>
            
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Players</Text>
              <Text style={styles.summaryValue}>
                {selectedPlayers.length} player{selectedPlayers.length > 1 ? 's' : ''}
              </Text>
            </Card>

            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Fine Type</Text>
              <Text style={styles.summaryValue}>{selectedSubcategory?.name}</Text>
            </Card>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (£)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.slate[500]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a note..."
                placeholderTextColor={colors.slate[500]}
                multiline
                numberOfLines={3}
              />
            </View>

            <Card style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                £{(parseFloat(amount || '0') * selectedPlayers.length).toFixed(2)}
              </Text>
            </Card>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        {step === 'confirm' ? (
          <Button
            onPress={handleSubmit}
            loading={batchIssueMutation.isPending}
            fullWidth
          >
            Issue {selectedPlayers.length} Fine{selectedPlayers.length > 1 ? 's' : ''}
          </Button>
        ) : (
          <Button
            onPress={handleNext}
            disabled={
              (step === 'players' && selectedPlayers.length === 0) ||
              (step === 'category' && !selectedSubcategory)
            }
            fullWidth
          >
            Continue
          </Button>
        )}
      </View>
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
    paddingTop: spacing['3xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[800],
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  stepIndicator: {
    fontSize: fontSize.xs,
    color: colors.slate[400],
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
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
    marginBottom: spacing.md,
  },
  selectAllText: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: fontWeight.semibold,
  },
  playerItem: {
    backgroundColor: colors.slate[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  playerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.white,
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
  categoryGroup: {
    marginBottom: spacing.lg,
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.slate[400],
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  subcategoryItem: {
    backgroundColor: colors.slate[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subcategoryItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  subcategoryName: {
    fontSize: fontSize.base,
    color: colors.white,
  },
  subcategoryAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.amber[500],
  },
  summaryCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.slate[400],
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.slate[300],
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.slate[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.white,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalCard: {
    backgroundColor: colors.primary[600],
    marginBottom: spacing.md,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.base,
    color: colors.white,
    opacity: 0.9,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
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
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    borderTopWidth: 1,
    borderTopColor: colors.slate[800],
  },
});
