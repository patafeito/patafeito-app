import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useKeyboardAwareField } from '../hooks/use-keyboard-aware-scroll';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing, touch, typography } from '../theme/tokens';

type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  /** Campo de senha com botão de mostrar/ocultar. */
  password?: boolean;
};

export function TextField({ label, hint, error, password, style, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);
  const keyboardAware = useKeyboardAwareField();
  return <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <View>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.textDisabled}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        {...inputProps}
        secureTextEntry={password ? !revealed : inputProps.secureTextEntry}
        onFocus={(event) => { setFocused(true); keyboardAware?.inputFocused(inputRef); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); keyboardAware?.inputBlurred(inputRef); onBlur?.(event); }}
        style={[styles.input, password && styles.inputWithAction, focused && styles.inputFocused, !!error && styles.inputError, style]}
      />
      {password ? <Pressable
        accessibilityRole="button"
        accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
        onPress={() => setRevealed((value) => !value)}
        hitSlop={4}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      >
        <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
      </Pressable> : null}
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text },
  input: { ...typography.body, color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.ms, minHeight: touch.button },
  inputWithAction: { paddingRight: touch.min + spacing.xs },
  inputFocused: { borderColor: colors.primary, borderWidth: 2, paddingHorizontal: spacing.md - 1 },
  inputError: { borderColor: colors.danger },
  action: { position: 'absolute', right: spacing.xs, top: 0, bottom: 0, width: touch.min, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  actionPressed: { opacity: 0.6 },
  error: { ...typography.bodySm, color: colors.danger },
  hint: { ...typography.bodySm, color: colors.textSecondary },
});
