import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing, typography } from '../theme/tokens';

type ChipGroupProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  /** `segmented` ocupa a largura toda, para alternar visões (Loja/Mochila, Pendentes/Concluídas). */
  variant?: 'chips' | 'segmented';
};

export function ChipGroup<T extends string>({ options, value, onChange, label, variant = 'chips' }: ChipGroupProps<T>) {
  const styles = useThemedStyles(makeStyles);
  const segmented = variant === 'segmented';
  return <View style={styles.container}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <View accessibilityRole="radiogroup" style={segmented ? styles.segmentedRow : styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: active }}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => [segmented ? styles.segment : styles.chip, active && (segmented ? styles.segmentActive : styles.chipActive), pressed && styles.pressed]}
        >
          <Text numberOfLines={1} style={[styles.chipLabel, active && (segmented ? styles.segmentLabelActive : styles.chipLabelActive)]}>{option.label}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}

const makeStyles = ({ colors, elevation }: Theme) => StyleSheet.create({
  container: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 40, justifyContent: 'center' },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  segmentedRow: { flexDirection: 'row', padding: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, gap: spacing.xs },
  segment: { flex: 1, minHeight: 40, paddingHorizontal: spacing.sm, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.surfaceElevated, ...elevation[1] },
  pressed: { opacity: 0.8 },
  chipLabel: { ...typography.label, color: colors.textSecondary },
  chipLabelActive: { color: colors.onPrimarySoft },
  segmentLabelActive: { color: colors.text },
});
