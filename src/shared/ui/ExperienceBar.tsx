import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing, typography } from '../theme/tokens';
import { ProgressBar } from './ProgressBar';

type ExperienceBarProps = { level: number; value: number; nextLevelAt: number };

export function ExperienceBar({ level, value, nextLevelAt }: ExperienceBarProps) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.container}>
    <View style={styles.level} accessible accessibilityLabel={`Nível ${level}`}><Text style={styles.levelText}>Nv {level}</Text></View>
    <View style={styles.bar}>
      <ProgressBar value={value} max={nextLevelAt} tone="xp" height={10} label="Experiência até o próximo nível" />
      <Text style={styles.value}>{value}/{nextLevelAt} XP</Text>
    </View>
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  level: { minWidth: 48, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.rewardSoft, borderWidth: 1, borderColor: colors.reward, alignItems: 'center' },
  levelText: { ...typography.reward, color: colors.rewardText },
  bar: { flex: 1, gap: 2 },
  value: { ...typography.caption, color: colors.textSecondary, fontVariant: ['tabular-nums'], alignSelf: 'flex-end' },
});
