import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { PixelImage } from '../../../shared/ui/PixelImage';
import { ProgressBar } from '../../../shared/ui/ProgressBar';
import { useTheme, useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../../shared/theme/tokens';
import type { AchievementProgress } from '../domain/catalog';

const medal = require('../../../../assets/shop/coin-sparkle.png') as number;

/** Medalha: desbloqueada ganha a moeda brilhante em pixel art; bloqueada mostra o ícone apagado e o progresso. */
export function AchievementBadge({ achievement }: { achievement: AchievementProgress }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { unlocked } = achievement;
  return <View
    style={[styles.card, unlocked && styles.unlocked]}
    accessible
    accessibilityLabel={`${achievement.title}. ${achievement.description} ${unlocked ? 'Conquistada.' : `Progresso: ${achievement.current} de ${achievement.goal}.`}`}
  >
    <View style={[styles.medal, unlocked && styles.medalUnlocked]}>
      {unlocked ? <PixelImage source={medal} size={44} /> : <Ionicons name={achievement.icon} size={24} color={colors.textDisabled} />}
    </View>
    <Text style={styles.title} numberOfLines={2}>{achievement.title}</Text>
    <Text style={styles.description} numberOfLines={2}>{achievement.description}</Text>
    {unlocked ? <Text style={styles.seal}>Conquistada</Text>
      : <View style={styles.progress}>
        <ProgressBar value={achievement.current} max={achievement.goal} tone="xp" height={6} />
        <Text style={styles.count}>{achievement.current}/{achievement.goal}</Text>
      </View>}
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  card: { flexBasis: '47%', flexGrow: 1, minWidth: 0, alignItems: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  unlocked: { borderColor: colors.reward },
  medal: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, marginBottom: spacing.xs },
  medalUnlocked: { backgroundColor: colors.rewardSoft },
  title: { ...typography.subheading, color: colors.text, textAlign: 'center' },
  description: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  seal: { ...typography.reward, fontSize: 13, color: colors.rewardText, marginTop: spacing.xs },
  progress: { alignSelf: 'stretch', gap: 2, marginTop: spacing.xs },
  count: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
