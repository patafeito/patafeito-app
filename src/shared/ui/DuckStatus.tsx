import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { spacing, typography } from '../theme/tokens';
import { ProgressBar, type ProgressTone } from './ProgressBar';

type DuckStatusProps = {
  label: 'Saciedade' | 'Energia' | 'Felicidade';
  value: number;
  icon: ComponentProps<typeof Ionicons>['name'];
  tone: ProgressTone;
};

export function DuckStatus({ label, value, icon, tone }: DuckStatusProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const iconColor = { water: colors.primary, xp: colors.rewardText, habit: colors.success }[tone];
  return <View style={styles.container} accessible accessibilityLabel={`${label}: ${value}%`}>
    <View style={styles.header}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <Text style={styles.value}>{value}%</Text>
    </View>
    <ProgressBar value={value} tone={tone} height={6} />
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  container: { gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  value: { ...typography.numeric, fontSize: 12, lineHeight: 16, color: colors.text },
});
