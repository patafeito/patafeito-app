import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { recurrenceLabel } from '../../features/tasks/domain/recurrence';
import { difficultyLabel, estimatedReward, isOverdue, type Task } from '../../features/tasks/domain/task';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing, typography } from '../theme/tokens';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { Badge } from './Badge';
import { RewardBurst } from './RewardBurst';

type TaskItemProps = { task: Task; onPress?: (task: Task) => void; onLongPress?: (task: Task) => void };

const difficultyTone = { easy: 'success', medium: 'experience', hard: 'danger' } as const;

function dueLabel(dueAt: string) {
  const due = new Date(dueAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (due.toDateString() === today.toDateString()) return 'Hoje';
  if (due.toDateString() === tomorrow.toDateString()) return 'Amanhã';
  return due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function TaskItem({ task, onPress, onLongPress }: TaskItemProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const completed = task.status === 'completed';
  const overdue = isOverdue(task);
  const [pop] = useState(() => new Animated.Value(1));
  const wasCompleted = useRef(completed);
  const [rewardKey, setRewardKey] = useState<number>();
  const reducedMotion = useReducedMotion();

  // Só anima a passagem para concluída; abrir a lista com tarefas já feitas não pula nada.
  useEffect(() => {
    if (completed && !wasCompleted.current) {
      setRewardKey(Date.now());
      if (!reducedMotion) {
        pop.setValue(0.6);
        Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
      }
    }
    wasCompleted.current = completed;
  }, [completed, pop, reducedMotion]);

  const reward = estimatedReward[task.difficulty];
  return <Pressable
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={completed ? `${task.title}, concluída` : `${task.title}, vale ${reward.xp} XP`}
    accessibilityHint={onPress ? `${completed ? 'Toque para desmarcar.' : 'Toque para concluir.'}${onLongPress ? ' Toque e segure para editar ou excluir.' : ''}` : undefined}
    disabled={!onPress}
    onPress={() => onPress?.(task)}
    onLongPress={onLongPress ? () => onLongPress(task) : undefined}
    style={({ pressed }) => [styles.item, overdue && styles.overdue, pressed && onPress && styles.pressed]}
  >
    <Animated.View style={[styles.check, completed && styles.checkCompleted, { transform: [{ scale: pop }] }]}>
      {completed ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : null}
    </Animated.View>
    <View style={styles.content}>
      <Text numberOfLines={2} style={[styles.title, completed && styles.completedTitle]}>{task.title}</Text>
      <View style={styles.badges}>
        <Badge tone={difficultyTone[task.difficulty]}>{difficultyLabel[task.difficulty]}</Badge>
        {task.dueAt ? <Badge tone={overdue ? 'danger' : 'neutral'}>{overdue ? `Venceu ${dueLabel(task.dueAt)}` : dueLabel(task.dueAt)}</Badge> : null}
        {task.recurrence ? <Badge tone="neutral">{recurrenceLabel({ recurrence: task.recurrence, recurrenceDay: task.recurrenceDay ?? null })}</Badge> : null}
        {task.pendingXp ? <Badge tone="experience">+{task.pendingXp} XP a confirmar</Badge> : null}
      </View>
    </View>
    {!completed ? <Text style={styles.xp}>+{reward.xp}</Text> : null}
    <RewardBurst trigger={rewardKey} xp={reward.xp} coins={reward.coins} />
  </Pressable>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.ms, paddingHorizontal: spacing.md, minHeight: 64 },
  overdue: { borderColor: colors.danger },
  pressed: { backgroundColor: colors.surfaceMuted },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkCompleted: { backgroundColor: colors.success, borderColor: colors.success },
  content: { flex: 1, gap: spacing.xs },
  title: { ...typography.subheading, color: colors.text },
  completedTitle: { textDecorationLine: 'line-through', color: colors.textSecondary, fontFamily: typography.body.fontFamily },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  xp: { ...typography.reward, fontSize: 14, color: colors.rewardText },
});
