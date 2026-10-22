import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../../features/auth/application/session-context';
import { buildRecommendation } from '../../features/home/domain/recommendation';
import { speciesById } from '../../features/onboarding/domain/species';
import { usePetReaction } from '../../features/pet/application/pet-mood';
import { PetStage } from '../../features/pet/components/PetStage';
import { loadLocalPet } from '../../features/pet/infrastructure/local-pet-repository';
import { pendingOperationCount } from '../../features/sync/infrastructure/sync-repository';
import { toggleTaskCompletion } from '../../features/tasks/application/toggle-task';
import { currentStreak, isForToday, type Task } from '../../features/tasks/domain/task';
import { listCompletionDates, listLocalTasks } from '../../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Screen } from '../../shared/ui/Screen';
import { TaskItem } from '../../shared/ui/TaskItem';
import { colors, spacing, typography } from '../../shared/theme/tokens';

async function loadHome() {
  const [pet, tasks, completionDates, pendingOperations] = await Promise.all([
    loadLocalPet(), listLocalTasks(), listCompletionDates(), pendingOperationCount(),
  ]);
  return {
    pet,
    todayTasks: tasks.filter((task) => isForToday(task) || task.status === 'completed').slice(0, 4),
    pendingTasks: tasks.filter((task) => task.status === 'pending'),
    streak: currentStreak(completionDates),
    pendingOperations,
    pendingXp: tasks.reduce((total, task) => total + (task.pendingXp ?? 0), 0),
  };
}

export default function HomeScreen() {
  const { user } = useSession();
  const { data, reload } = useLocalData(loadHome);
  const reaction = usePetReaction();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [message, setMessage] = useState<string>();

  async function toggle(task: Task) {
    const result = await toggleTaskCompletion(task);
    setMessage(result.action === 'completed' ? undefined : result.message);
    await reload();
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
    {data?.todayTasks.length ? data.todayTasks.map((task: Task) => <TaskItem key={task.id} task={task} onPress={() => void toggle(task)} />)
      : <Text style={styles.muted}>Nenhuma tarefa para hoje ainda. Comece pequeno: uma tarefa clara já é progresso.</Text>}
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
