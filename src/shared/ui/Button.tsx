import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, styles[variant], pressed && !disabled && styles.pressed, disabled && styles.disabled]}><Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  label: { ...typography.label, fontSize: 16 },
  primaryLabel: { color: colors.background },
  secondaryLabel: { color: colors.text },
});
