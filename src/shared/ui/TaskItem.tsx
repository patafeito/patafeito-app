import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Task } from '../../features/tasks/domain/task';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { Badge } from './Badge';

type TaskItemProps = { task: Task; onPress?: (task: Task) => void };

const difficultyLabel = { easy: 'Fácil', medium: 'Média', hard: 'Difícil' } as const;
const difficultyTone = { easy: 'success', medium: 'experience', hard: 'danger' } as const;

export function TaskItem({ task, onPress }: TaskItemProps) {
  const completed = task.status === 'completed';
  return <Pressable disabled={!onPress} onPress={() => onPress?.(task)} style={({ pressed }) => [styles.item, completed && styles.completed, pressed && onPress && styles.pressed]}>
    <View style={[styles.check, completed && styles.checkCompleted]}><Text style={styles.checkLabel}>{completed ? '✓' : ''}</Text></View>
    <View style={styles.content}><Text numberOfLines={1} style={[styles.title, completed && styles.completedTitle]}>{task.title}</Text><Badge tone={difficultyTone[task.difficulty]}>{difficultyLabel[task.difficulty]}</Badge></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.md },
  pressed: { opacity: 0.82 },
  completed: { opacity: 0.65 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkCompleted: { backgroundColor: colors.success, borderColor: colors.success },
  checkLabel: { ...typography.label, color: colors.background, fontSize: 13 },
  content: { flex: 1, gap: spacing.xs },
  title: { ...typography.body, color: colors.text, fontSize: 16 },
  completedTitle: { textDecorationLine: 'line-through' },
});
