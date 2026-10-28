import { StyleSheet, Text, View } from 'react-native';
import { loadAchievements } from '../features/achievements/application/load-achievements';
import { AchievementBadge } from '../features/achievements/components/AchievementBadge';
import { useLocalData } from '../shared/hooks/use-local-data';
import { Card } from '../shared/ui/Card';
import { SectionHeader } from '../shared/ui/Headers';
import { ProgressBar } from '../shared/ui/ProgressBar';
import { Screen } from '../shared/ui/Screen';
import { useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { spacing, typography } from '../shared/theme/tokens';

export default function AchievementsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data } = useLocalData(loadAchievements);
  if (!data) return <Screen edges={['left', 'right', 'bottom']}>{null}</Screen>;

  const unlocked = data.progress.filter((item) => item.unlocked);
  const locked = data.progress.filter((item) => !item.unlocked);
  return <Screen edges={['left', 'right', 'bottom']}>
    <Card tone="elevated" style={styles.summary}>
      <Text style={styles.count}>{data.unlocked}<Text style={styles.total}> / {data.progress.length}</Text></Text>
      <Text style={styles.muted}>conquistas desbloqueadas</Text>
      <ProgressBar value={data.unlocked} max={data.progress.length} tone="xp" height={10} label="Conquistas desbloqueadas" />
      {data.next ? <Text style={styles.muted}>Mais perto: <Text style={styles.strong}>{data.next.title}</Text> ({data.next.current}/{data.next.goal})</Text> : null}
    </Card>

    {unlocked.length ? <>
      <SectionHeader title="Conquistadas" />
      <View style={styles.grid}>{unlocked.map((item) => <AchievementBadge key={item.id} achievement={item} />)}</View>
    </> : null}

    {locked.length ? <>
      <SectionHeader title="A caminho" />
      <View style={styles.grid}>{locked.map((item) => <AchievementBadge key={item.id} achievement={item} />)}</View>
    </> : null}
  </Screen>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  summary: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  count: { ...typography.display, fontSize: 44, lineHeight: 50, color: colors.rewardText },
  total: { ...typography.title, color: colors.textSecondary },
  muted: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center' },
  strong: { fontFamily: typography.label.fontFamily, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.ms },
});
