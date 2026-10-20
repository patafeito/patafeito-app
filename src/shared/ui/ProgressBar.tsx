import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme/tokens';

type ProgressBarProps = { value: number; max?: number; color?: string; height?: number };

export function ProgressBar({ value, max = 100, color = colors.primary, height = 8 }: ProgressBarProps) {
  const width = `${Math.min(Math.max(value / max, 0), 1) * 100}%`;
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: Math.min(Math.max(value, 0), max) }} style={[styles.track, { height }]}><View style={[styles.fill, { backgroundColor: color, width }]} /></View>;
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  fill: { height: '100%', borderRadius: radius.pill },
});
