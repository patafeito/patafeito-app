import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../theme/tokens';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'raised' | 'primary';
}>;

export function Card({ children, style, tone = 'default' }: CardProps) {
  return <View style={[styles.card, styles[tone], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, ...shadows.card },
  default: { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
  raised: { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
  primary: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
});
