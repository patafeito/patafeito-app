import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, style, ...inputProps }: TextFieldProps) {
  return <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      placeholderTextColor={colors.textMuted}
      {...inputProps}
      style={[styles.input, !!error && styles.inputError, style]}
    />
    {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text, fontSize: 14 },
  input: { ...typography.body, color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontSize: 16, minHeight: 52 },
  inputError: { borderColor: colors.danger },
  error: { ...typography.body, color: colors.danger, fontSize: 13 },
  hint: { ...typography.body, color: colors.textMuted, fontSize: 13 },
});
