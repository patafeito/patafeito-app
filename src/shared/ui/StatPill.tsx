import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing, typography } from '../theme/tokens';
import { PixelImage } from './PixelImage';

type StatPillProps = {
  value: string | number;
  /** Pixel art para recompensas (moeda); Ionicons para o resto (sequência). */
  image?: ImageSourcePropType;
  icon?: ComponentProps<typeof Ionicons>['name'];
  tone?: 'reward' | 'streak' | 'neutral';
  accessibilityLabel: string;
  onPress?: () => void;
};

/** Indicador compacto de gamificação (moedas, sequência, nível) para headers. */
export function StatPill({ value, image, icon, tone = 'neutral', accessibilityLabel, onPress }: StatPillProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const tint = { reward: colors.rewardText, streak: colors.tertiary, neutral: colors.text }[tone];
  const content = <>
    {image ? <PixelImage source={image} size={20} /> : icon ? <Ionicons name={icon} size={18} color={tint} /> : null}
    <Text style={[styles.value, { color: tint }]}>{value}</Text>
  </>;
  if (!onPress) return <View style={styles.pill} accessible accessibilityLabel={accessibilityLabel}>{content}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>{content}</Pressable>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 36, paddingHorizontal: spacing.ms, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pressed: { backgroundColor: colors.surfaceMuted },
  value: { ...typography.numeric, fontSize: 14 },
});
