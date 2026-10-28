import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing, typography } from '../theme/tokens';

type BadgeTone = 'primary' | 'experience' | 'success' | 'danger' | 'neutral';

export function Badge({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: BadgeTone }>) {
  const styles = useThemedStyles(makeStyles);
  return <View style={[styles.badge, styles[`${tone}Background`]]}><Text style={[styles.label, styles[`${tone}Label`]]}>{children}</Text></View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  label: { ...typography.caption },
  primaryBackground: { backgroundColor: colors.primarySoft }, primaryLabel: { color: colors.onPrimarySoft },
  experienceBackground: { backgroundColor: colors.warningSoft }, experienceLabel: { color: colors.onWarningSoft },
  successBackground: { backgroundColor: colors.successSoft }, successLabel: { color: colors.onSuccessSoft },
  dangerBackground: { backgroundColor: colors.dangerSoft }, dangerLabel: { color: colors.onDangerSoft },
  neutralBackground: { backgroundColor: colors.surfaceMuted }, neutralLabel: { color: colors.textSecondary },
});
