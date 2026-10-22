import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { colors, spacing, typography } from '../theme/tokens';
import { ProgressBar } from './ProgressBar';

type DuckStatusProps = {
  label: 'Fome' | 'Energia' | 'Felicidade';
  value: number;
  icon: ComponentProps<typeof Ionicons>['name'];
  color?: string;
};

export function DuckStatus({ label, value, icon, color = colors.primary }: DuckStatusProps) {
  return <View style={styles.container}>
    <View style={styles.header}>
      <View style={styles.title}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}%</Text>
    </View>
    <ProgressBar value={value} color={color} height={6} />
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.xs },
  title: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  label: { ...typography.body, color: colors.textMuted, fontSize: 13 },
  value: { ...typography.numeric, fontSize: 13 },
});
