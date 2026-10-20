import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { ProgressBar } from './ProgressBar';

type DuckStatusProps = { label: 'Fome' | 'Energia' | 'Felicidade'; value: number; icon: string; color?: string };

export function DuckStatus({ label, value, icon, color = colors.primary }: DuckStatusProps) {
  return <View style={styles.container}>
    <View style={styles.header}><Text style={styles.label}>{icon} {label}</Text><Text style={[styles.value, { color }]}>{value}%</Text></View>
    <ProgressBar value={value} color={color} height={6} />
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.body, color: colors.textMuted, fontSize: 12 },
  value: { ...typography.numeric, fontSize: 12 },
});
