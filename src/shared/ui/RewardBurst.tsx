import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { coinIcon } from '../../features/shop/domain/catalog';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { motion, spacing, typography } from '../theme/tokens';
import { PixelImage } from './PixelImage';

type RewardBurstProps = {
  /** Muda a cada recompensa nova; dispara a animação. */
  trigger: number | string | undefined;
  xp?: number;
  coins?: number;
};

/**
 * "+20 XP" e a moeda sobem e somem por cima do elemento (posicione o pai como `relative`).
 * Com movimento reduzido, só aparece e some.
 */
export function RewardBurst({ trigger, xp, coins }: RewardBurstProps) {
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (trigger === undefined) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: reducedMotion ? motion.slow * 2 : 900, easing: Easing.out(Easing.quad), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion, trigger]);

  if (trigger === undefined || (!xp && !coins)) return null;
  const opacity = progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, reducedMotion ? 0 : -28] });
  return <Animated.View pointerEvents="none" style={[styles.burst, { opacity, transform: [{ translateY }] }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {xp ? <Animated.Text style={styles.xp}>+{xp} XP</Animated.Text> : null}
    {coins ? <View style={styles.coins}><PixelImage source={coinIcon} size={18} /><Animated.Text style={styles.xp}>+{coins}</Animated.Text></View> : null}
  </Animated.View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  burst: { position: 'absolute', right: spacing.md, top: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  xp: { ...typography.reward, color: colors.rewardText },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
