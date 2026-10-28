import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, touch } from '../theme/tokens';

type IconButtonProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'plain';
};

export function IconButton({ icon, label, onPress, tone = 'default' }: IconButtonProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const color = tone === 'primary' ? colors.onPrimary : colors.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.button, styles[tone], pressed && styles.pressed]}><Ionicons name={icon} size={22} color={color} /></Pressable>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  button: { width: touch.min, height: touch.min, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  default: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  primary: { backgroundColor: colors.primary },
  plain: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});
