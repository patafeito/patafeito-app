import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { motion, radius } from '../theme/tokens';

/** water: foco e energia. xp: experiência e moedas. habit: hábitos e sucesso. */
export type ProgressTone = 'water' | 'xp' | 'habit';

type ProgressBarProps = { value: number; max?: number; tone?: ProgressTone; color?: string; height?: number; label?: string };

/** Barra com um reflexo de água no topo; enche suavemente (sem animação com movimento reduzido). */
export function ProgressBar({ value, max = 100, tone = 'water', color, height = 8, label }: ProgressBarProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const [fill] = useState(() => new Animated.Value(ratio));

  useEffect(() => {
    if (reducedMotion) return fill.setValue(ratio);
    const animation = Animated.timing(fill, { toValue: ratio, duration: motion.celebrate, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [fill, ratio, reducedMotion]);

  const background = color ?? { water: colors.primary, xp: colors.reward, habit: colors.success }[tone];
  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return <View
    accessibilityRole="progressbar"
    accessibilityLabel={label}
    accessibilityValue={{ min: 0, max, now: Math.min(Math.max(value, 0), max) }}
    style={[styles.track, { height }]}
  >
    <Animated.View style={[styles.fill, { backgroundColor: background, width }]}>
      {height >= 8 ? <View style={[styles.shine, { height: Math.max(2, Math.round(height * 0.3)) }]} /> : null}
    </Animated.View>
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  track: { width: '100%', overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  fill: { height: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  shine: { position: 'absolute', top: 1, left: 4, right: 4, borderRadius: radius.pill, backgroundColor: 'rgba(255, 255, 255, 0.28)' },
});
