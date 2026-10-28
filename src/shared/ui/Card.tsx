import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  /**
   * default: superfície com borda discreta. elevated: destaque com sombra (no máximo um por tela).
   * muted: agrupamento secundário, sem borda. primary: o próximo passo recomendado.
   */
  tone?: 'default' | 'elevated' | 'muted' | 'primary';
}>;

export function Card({ children, style, tone = 'default' }: CardProps) {
  const styles = useThemedStyles(makeStyles);
  return <View style={[styles.card, styles[tone], style]}>{children}</View>;
}

const makeStyles = ({ colors, elevation }: Theme) => StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  default: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  elevated: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, ...elevation[1] },
  muted: { backgroundColor: colors.surfaceMuted },
  primary: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
});
