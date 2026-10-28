import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing, touch, typography } from '../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'dangerOutline';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** `compact` para ações dentro de cards e listas. */
  size?: 'regular' | 'compact';
};

/**
 * primary: a ação principal da tela (uma só). secondary: alternativa com contorno.
 * tertiary: ação leve sobre fundo suave. ghost: só texto. danger: confirma apagar ou algo sem volta;
 * dangerOutline: oferece apagar sem ser a ação principal.
 */
export function Button({ label, onPress, variant = 'primary', disabled = false, icon, size = 'regular' }: ButtonProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const tint = { primary: colors.onPrimary, secondary: colors.text, tertiary: colors.onPrimarySoft, ghost: colors.primary, danger: colors.onPrimary, dangerOutline: colors.danger }[variant];
  return <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [styles.button, size === 'compact' && styles.compact, styles[variant], pressed && !disabled && [styles.pressed, styles[`${variant}Pressed`]], disabled && styles.disabled]}
  >
    {icon ? <Ionicons name={icon} size={size === 'compact' ? 18 : 20} color={tint} /> : null}
    <Text numberOfLines={1} style={[styles.label, { color: tint }]}>{label}</Text>
  </Pressable>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  button: { minHeight: touch.button, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.ms, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  compact: { minHeight: touch.min, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderStrong },
  secondaryPressed: { backgroundColor: colors.surfaceMuted },
  tertiary: { backgroundColor: colors.primarySoft },
  tertiaryPressed: { opacity: 0.85 },
  ghost: { backgroundColor: 'transparent' },
  ghostPressed: { backgroundColor: colors.primarySoft },
  danger: { backgroundColor: colors.danger },
  dangerPressed: { opacity: 0.88 },
  dangerOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.danger },
  dangerOutlinePressed: { backgroundColor: colors.dangerSoft },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  // flexShrink + uma linha: o rótulo nunca quebra no meio do botão (no web, a medição antes da fonte carregar quebrava).
  label: { ...typography.button, flexShrink: 1, textAlign: 'center' },
});
