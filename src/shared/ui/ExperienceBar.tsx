import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { ProgressBar } from './ProgressBar';

type ExperienceBarProps = { level: number; value: number; nextLevelAt: number };

export function ExperienceBar({ level, value, nextLevelAt }: ExperienceBarProps) {
  return <View style={styles.container}>
    <View style={styles.header}><Text style={styles.level}>Nível {level}</Text><Text style={styles.value}>{value}/{nextLevelAt} XP</Text></View>
    <ProgressBar value={value} max={nextLevelAt} color={colors.experience} />
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  level: { ...typography.label, color: colors.text, fontSize: 13 },
  value: { ...typography.numeric, color: colors.experience, fontSize: 12 },
});
