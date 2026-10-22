import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { colors, radius } from '../theme/tokens';

type IconButtonProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary';
};

export function IconButton({ icon, label, onPress, tone = 'default' }: IconButtonProps) {
  const color = tone === 'primary' ? colors.background : colors.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.button, styles[tone], pressed && styles.pressed]}><Ionicons name={icon} size={20} color={color} /></Pressable>;
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  default: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  primary: { backgroundColor: colors.primary },
  pressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
