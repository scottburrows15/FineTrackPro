import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'gradient';
  gradientColors?: readonly [string, string];
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function GradientCard({ 
  children, 
  style, 
  colors: cardColors 
}: { 
  children: React.ReactNode; 
  style?: ViewStyle;
  colors: readonly [string, string];
}) {
  return (
    <View style={[styles.gradientCard, { backgroundColor: cardColors[0] }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.slate[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  gradientCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
});

export default Card;
