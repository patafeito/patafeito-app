import { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../../features/auth/application/session-context';
import { buildRecommendation } from '../../features/home/domain/recommendation';
import { speciesById } from '../../features/onboarding/domain/species';
import { usePetReaction } from '../../features/pet/application/pet-mood';
import { PetStage } from '../../features/pet/components/PetStage';
import { loadLocalPet } from '../../features/pet/infrastructure/local-pet-repository';
import { hasFailedSendAttempt, pendingOperationCount } from '../../features/sync/infrastructure/sync-repository';
import { toggleTaskCompletion } from '../../features/tasks/application/toggle-task';
import { currentStreak, isForToday, isOverdue, type Task } from '../../features/tasks/domain/task';
import { ensureRecurringOccurrences, listCompletionDates, listLocalTasks } from '../../features/tasks/infrastructure/local-task-repository';
import { syncInBackground } from '../../features/sync/application/sync-startup';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { FadeOut } from '../../shared/ui/FadeOut';
import { Screen } from '../../shared/ui/Screen';
import { TaskItem } from '../../shared/ui/TaskItem';
import { colors, spacing, typography } from '../../shared/theme/tokens';

async function loadHome() {
  if (await ensureRecurringOccurrences()) syncInBackground();
  const [pet, tasks, completionDates, pendingOperations, sendFailed] = await Promise.all([
    loadLocalPet(), listLocalTasks(), listCompletionDates(), pendingOperationCount(), hasFailedSendAttempt(),
  ]);
  return {
    pet,
    todayTasks: tasks.filter((task) => task.status === 'pending' && isForToday(task)).slice(0, 4),
    finishedToday: tasks.some((task) => !!task.completedAt && new Date(task.completedAt).toDateString() === new Date().toDateString()),
    pendingTasks: tasks.filter((task) => task.status === 'pending'),
    streak: currentStreak(completionDates),
    pendingOperations,
    // Com rede, o XP é confirmado em instantes; o aviso só aparece quando o envio falhou.
    pendingXp: sendFailed ? tasks.reduce((total, task) => total + (task.pendingXp ?? 0), 0) : 0,
  };
}

export default function HomeScreen() {
  const { user } = useSession();
  const { data, reload } = useLocalData(loadHome);
  const reaction = usePetReaction();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [message, setMessage] = useState<string>();
  // Tarefas recém-concluídas ficam na posição em que estavam até o fade terminar.
  const [leaving, setLeaving] = useState<{ task: Task; index: number }[]>([]);

  const shownTasks = (data?.todayTasks ?? []).filter((task) => !leaving.some((item) => item.task.id === task.id));
  for (const item of [...leaving].sort((a, b) => a.index - b.index)) shownTasks.splice(Math.min(item.index, shownTasks.length), 0, item.task);

  async function toggle(task: Task) {
    const completing = task.status === 'pending' && !isOverdue(task);
    if (completing) {
      const index = shownTasks.findIndex((item) => item.id === task.id);
      setLeaving((items) => [...items, { task: { ...task, status: 'completed' }, index }]);
    }
    const result = await toggleTaskCompletion(task);
    if (completing && result.action !== 'completed') setLeaving((items) => items.filter((item) => item.task.id !== task.id));
    setMessage(result.action === 'completed' ? undefined : result.message);
    await reload();
  }

  function finishLeaving(taskId: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLeaving((items) => items.filter((item) => item.task.id !== taskId));
  }

  const pet = data?.pet;
  const species = speciesById(pet?.speciesId);
  const recommendation = buildRecommendation(species, { pendingTasks: data?.pendingTasks ?? [], streak: data?.streak ?? 0 });

  useEffect(() => {
    if (!reaction) return;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    void reload();
  }, [reaction, reload]);

  return <Screen scrollRef={scrollRef}>
    <Text style={styles.greeting}>Oi{user ? `, ${user.displayName.split(' ')[0]}` : ''}!</Text>

    {pet ? <PetStage pet={pet} streak={data?.streak ?? 0} pendingXp={data?.pendingXp} />
      : <Card><Text style={styles.muted}>Seu pato aparece aqui assim que for criado.</Text></Card>}

    <Card tone="primary" style={styles.recommendation}>
      <Text style={styles.cardTitle}>{recommendation.title}</Text>
      <Text style={styles.muted}>{recommendation.body}</Text>
      <Button label={recommendation.action.label} onPress={() => router.push(recommendation.action.href)} />
    </Card>

    <View style={styles.actions}>
      <View style={styles.action}><Button label="Nova tarefa" variant="secondary" onPress={() => router.push('/(tabs)/tasks')} /></View>
      <View style={styles.action}><Button label="Iniciar foco" variant="secondary" onPress={() => router.push('/(tabs)/focus')} /></View>
    </View>

    <Text style={styles.sectionTitle}>Hoje</Text>
    {shownTasks.length ? shownTasks.map((task: Task) => {
      const isLeaving = leaving.some((item) => item.task.id === task.id);
      return <FadeOut key={task.id} active={isLeaving} onDone={() => finishLeaving(task.id)}>
        <TaskItem task={task} onPress={isLeaving ? undefined : () => void toggle(task)} />
      </FadeOut>;
    })
      : <Text style={styles.muted}>{data?.finishedToday ? 'Tudo feito por hoje. Patafeito!' : 'Nenhuma tarefa para hoje ainda. Comece pequeno: uma tarefa clara já é progresso.'}</Text>}
    {message ? <Text style={styles.muted}>{message}</Text> : null}

    {data?.pendingOperations ? <Text style={styles.pending}>{data.pendingOperations} {data.pendingOperations === 1 ? 'alteração será sincronizada' : 'alterações serão sincronizadas'} quando a rede voltar.</Text> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  greeting: { ...typography.display, color: colors.text, fontSize: 22 },
  cardTitle: { ...typography.heading, color: colors.text, fontSize: 17 },
  sectionTitle: { ...typography.heading, color: colors.text, fontSize: 18, marginTop: spacing.sm },
  muted: { ...typography.body, color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  pending: { ...typography.body, color: colors.textMuted, fontSize: 13 },
  recommendation: { gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
