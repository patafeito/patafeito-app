import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type BadgeTone = 'primary' | 'experience' | 'success' | 'danger' | 'neutral';

export function Badge({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: BadgeTone }>) {
  return <View style={[styles.badge, styles[`${tone}Background`]]}><Text style={[styles.label, styles[`${tone}Label`]]}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  label: { ...typography.label, fontSize: 12 },
  primaryBackground: { backgroundColor: colors.primarySoft }, primaryLabel: { color: colors.primary },
  experienceBackground: { backgroundColor: '#5A4B1B' }, experienceLabel: { color: colors.experience },
  successBackground: { backgroundColor: '#1C4C41' }, successLabel: { color: colors.success },
  dangerBackground: { backgroundColor: '#543B3E' }, dangerLabel: { color: colors.danger },
  neutralBackground: { backgroundColor: colors.surfaceMuted }, neutralLabel: { color: colors.textMuted },
});
