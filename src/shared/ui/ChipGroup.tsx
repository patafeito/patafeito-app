import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type ChipGroupProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
};

export function ChipGroup<T extends string>({ options, value, onChange, label }: ChipGroupProps<T>) {
  return <View style={styles.container}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: active }}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
        >
          <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text, fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 40, justifyContent: 'center' },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  pressed: { opacity: 0.82 },
  chipLabel: { ...typography.label, color: colors.textMuted, fontSize: 13 },
  chipLabelActive: { color: colors.primary },
});
