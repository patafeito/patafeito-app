import { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { loadAchievements } from '../../features/achievements/application/load-achievements';
import { useSession } from '../../features/auth/application/session-context';
import { buildRecommendation } from '../../features/home/domain/recommendation';
import { speciesById } from '../../features/onboarding/domain/species';
import { usePetReaction } from '../../features/pet/application/pet-mood';
import { PetStage } from '../../features/pet/components/PetStage';
import { loadLocalPet } from '../../features/pet/infrastructure/local-pet-repository';
import { cachedBalance } from '../../features/rewards/infrastructure/balance-repository';
import { hasFailedSendAttempt, pendingOperationCount } from '../../features/sync/infrastructure/sync-repository';
import { coinIcon } from '../../features/shop/domain/catalog';
import { cachedBoosts, equippedBackgroundSku } from '../../features/shop/infrastructure/shop-repository';
import { toggleTaskCompletion } from '../../features/tasks/application/toggle-task';
import { currentStreak, isForToday, isOverdue, type Task } from '../../features/tasks/domain/task';
import { ensureRecurringOccurrences, listCompletionDates, listLocalTasks } from '../../features/tasks/infrastructure/local-task-repository';
import { syncInBackground } from '../../features/sync/application/sync-startup';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { EmptyState } from '../../shared/ui/EmptyState';
import { FadeOut } from '../../shared/ui/FadeOut';
import { ScreenHeader, SectionHeader } from '../../shared/ui/Headers';
import { IconButton } from '../../shared/ui/IconButton';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { Screen } from '../../shared/ui/Screen';
import { StatPill } from '../../shared/ui/StatPill';
import { TaskItem } from '../../shared/ui/TaskItem';
import { useTheme, useThemedStyles, type Theme } from '../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../shared/theme/tokens';

async function loadHome() {
  if (await ensureRecurringOccurrences()) syncInBackground();
  const [pet, tasks, completionDates, pendingOperations, sendFailed, boosts, backgroundSku, balance, achievements] = await Promise.all([
    loadLocalPet(), listLocalTasks(), listCompletionDates(), pendingOperationCount(), hasFailedSendAttempt(), cachedBoosts(), equippedBackgroundSku(), cachedBalance(), loadAchievements(),
  ]);
  return {
    pet,
    todayTasks: tasks.filter((task) => task.status === 'pending' && isForToday(task)).slice(0, 4),
    finishedToday: tasks.some((task) => !!task.completedAt && new Date(task.completedAt).toDateString() === new Date().toDateString()),
    pendingTasks: tasks.filter((task) => task.status === 'pending'),
    streak: currentStreak(completionDates, new Date(), boosts.protectedDates),
    backgroundSku,
    pendingOperations,
    coins: balance?.coins ?? 0,
    achievements,
    // Com rede, o XP é confirmado em instantes; o aviso só aparece quando o envio falhou.
    pendingXp: sendFailed ? tasks.reduce((total, task) => total + (task.pendingXp ?? 0), 0) : 0,
  };
}

function greetingFor(date: Date) {
  const hour = date.getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
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
  const next = data?.achievements.next;

  useEffect(() => {
    if (!reaction) return;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    void reload();
  }, [reaction, reload]);

  return <Screen scrollRef={scrollRef} edges={['top', 'left', 'right']}>
    <ScreenHeader
      title={`${greetingFor(new Date())}${user ? `, ${user.displayName.split(' ')[0]}` : ''}!`}
      subtitle={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      trailing={<IconButton icon="person-outline" label="Abrir perfil" onPress={() => router.push('/profile')} />}
    />
    <View style={styles.stats}>
      <StatPill image={coinIcon} value={data?.coins ?? 0} tone="reward" accessibilityLabel={`${data?.coins ?? 0} moedas. Abrir loja`} onPress={() => router.push('/shop')} />
      <StatPill icon="flame" value={`${data?.streak ?? 0} ${data?.streak === 1 ? 'dia' : 'dias'}`} tone="streak" accessibilityLabel={`Sequência de ${data?.streak ?? 0} dias`} />
    </View>

    {pet ? <PetStage pet={pet} streak={data?.streak ?? 0} pendingXp={data?.pendingXp} backgroundSku={data?.backgroundSku} aspectRatio={1.45} showStats={false} />
      : <Card><Text style={styles.muted}>Seu pato aparece aqui assim que for criado.</Text></Card>}

    <Card tone="primary" style={styles.recommendation}>
      <Text style={styles.eyebrow}>Próximo passo</Text>
      <Text style={styles.cardTitle}>{recommendation.title}</Text>
      <Text style={styles.body}>{recommendation.body}</Text>
      <Button label={recommendation.action.label} onPress={() => router.push(recommendation.action.href)} />
    </Card>

    <SectionHeader title="Hoje" actionLabel="Ver todas" onAction={() => router.push('/(tabs)/tasks')} />
    {shownTasks.length ? <View style={styles.list}>
      {shownTasks.map((task: Task) => {
        const isLeaving = leaving.some((item) => item.task.id === task.id);
        return <FadeOut key={task.id} active={isLeaving} onDone={() => finishLeaving(task.id)}>
          <TaskItem task={task} onPress={isLeaving ? undefined : () => void toggle(task)} />
        </FadeOut>;
      })}
    </View>
      : data?.finishedToday
        ? <EmptyState species={species.id} state="cheer" title="Tudo feito por hoje. Patafeito!" message="Aproveite o resto do dia. Amanhã tem mais lago para explorar." />
        : <EmptyState species="pingo" title="Nenhuma tarefa para hoje" message="Comece pequeno: uma tarefa clara já é progresso." actionLabel="Criar tarefa" onAction={() => router.push('/(tabs)/tasks')} />}
    {message ? <Text style={styles.muted}>{message}</Text> : null}

    {data ? <Pressable accessibilityRole="button" accessibilityLabel={`Conquistas: ${data.achievements.unlocked} desbloqueadas. Ver todas`} onPress={() => router.push('/achievements')} style={({ pressed }) => [styles.rewards, pressed && styles.rewardsPressed]}>
      <View style={styles.rewardsIcon}><Ionicons name="trophy" size={20} color={colors.rewardText} /></View>
      <View style={styles.rewardsText}>
        <Text style={styles.rewardsTitle}>{data.achievements.unlocked} de {data.achievements.progress.length} conquistas</Text>
        {next ? <>
          <Text style={styles.small}>Próxima: {next.title} · {next.current}/{next.goal}</Text>
          <ProgressBar value={next.current} max={next.goal} tone="xp" height={6} />
        </> : <Text style={styles.small}>Você conquistou tudo. Que lago!</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable> : null}

    {data?.pendingOperations ? <View style={styles.pendingRow}>
      <Ionicons name="cloud-upload-outline" size={16} color={colors.textSecondary} />
      <Text style={styles.small}>{data.pendingOperations} {data.pendingOperations === 1 ? 'alteração será sincronizada' : 'alterações serão sincronizadas'} quando a rede voltar.</Text>
    </View> : null}
  </Screen>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: -spacing.xs },
  eyebrow: { ...typography.caption, color: colors.onPrimarySoft, textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle: { ...typography.heading, color: colors.text },
  body: { ...typography.body, color: colors.text },
  muted: { ...typography.body, color: colors.textSecondary },
  small: { ...typography.bodySm, color: colors.textSecondary, flexShrink: 1 },
  recommendation: { gap: spacing.sm, padding: spacing.lg - 4 },
  list: { gap: spacing.sm },
  rewards: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  rewardsPressed: { backgroundColor: colors.surfaceMuted },
  rewardsIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rewardSoft },
  rewardsText: { flex: 1, gap: spacing.xs },
  rewardsTitle: { ...typography.subheading, color: colors.text },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
