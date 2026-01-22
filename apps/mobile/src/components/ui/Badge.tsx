import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '../../theme';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.slate[700], text: colors.white },
  success: { bg: colors.primary[500], text: colors.white },
  danger: { bg: colors.red[600], text: colors.white },
  warning: { bg: colors.amber[500], text: colors.white },
  info: { bg: colors.blue[500], text: colors.white },
};

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const variantStyle = variantStyles[variant];
  
  return (
    <View style={[styles.badge, { backgroundColor: variantStyle.bg }, style]}>
      <Text style={[styles.text, { color: variantStyle.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

export default Badge;
