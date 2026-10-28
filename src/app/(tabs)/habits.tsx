import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { buildHabits, type Habit } from '../../features/habits/domain/habit';
import { celebrate } from '../../features/pet/application/pet-mood';
import { PetSprite } from '../../features/pet/components/PetSprite';
import { syncInBackground } from '../../features/sync/application/sync-startup';
import { toggleTaskCompletion } from '../../features/tasks/application/toggle-task';
import { weekdayLabels, type Recurrence } from '../../features/tasks/domain/recurrence';
import { estimatedReward } from '../../features/tasks/domain/task';
import { createLocalTask, ensureRecurringOccurrences, listLocalTasks } from '../../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { ChipGroup } from '../../shared/ui/ChipGroup';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ScreenHeader, SectionHeader } from '../../shared/ui/Headers';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { RewardBurst } from '../../shared/ui/RewardBurst';
import { Screen } from '../../shared/ui/Screen';
import { TextField } from '../../shared/ui/TextField';
import { WeekDots } from '../../shared/ui/WeekDots';
import { useTheme, useThemedStyles, type Theme } from '../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../shared/theme/tokens';

const frequencyOptions: { value: Recurrence; label: string }[] = [
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekly', label: 'Toda semana' },
  { value: 'monthly', label: 'Todo mês' },
];
const weekdayOptions = weekdayLabels.map((label, day) => ({ value: String(day), label }));

async function loadHabits() {
  if (await ensureRecurringOccurrences()) syncInBackground();
  return buildHabits(await listLocalTasks());
}

export default function HabitsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data: habits, reload } = useLocalData(loadHabits);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<Recurrence>('daily');
  const [weekday, setWeekday] = useState(() => new Date().getDay());
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [rewarded, setRewarded] = useState<{ seriesId: string; at: number }>();

  const scheduledToday = (habits ?? []).filter((habit) => habit.today || habit.doneToday);
  const doneToday = scheduledToday.filter((habit) => habit.doneToday).length;
  const allDone = scheduledToday.length > 0 && doneToday === scheduledToday.length;

  async function create() {
    const value = title.trim();
    if (!value) return setError('Dê um nome ao hábito.');
    const day = frequency === 'weekly' ? weekday : frequency === 'monthly' ? new Date().getDate() : null;
    await createLocalTask({ title: value, difficulty: 'easy', dueAt: null, rule: { recurrence: frequency, recurrenceDay: day } });
    setTitle('');
    setError(undefined);
    setCreating(false);
    setMessage(`Hábito criado. Cada vez vale ${estimatedReward.easy.xp} XP.`);
    await reload();
    syncInBackground();
  }

  async function mark(habit: Habit) {
    if (!habit.today) return;
    const result = await toggleTaskCompletion(habit.today);
    setMessage(result.action === 'completed' ? undefined : result.message);
    if (result.action === 'completed') {
      setRewarded((previous) => ({ seriesId: habit.seriesId, at: (previous?.at ?? 0) + 1 }));
      celebrate('cheer', { message: `“${habit.title}” feito. Rotina é isso!` });
    }
    await reload();
  }

  return <Screen edges={['top', 'left', 'right']}>
    <ScreenHeader
      title="Hábitos"
      subtitle={scheduledToday.length ? `${doneToday} de ${scheduledToday.length} feitos hoje` : 'Pequenas rotinas, todo dia um pouco'}
    />

    {allDone ? <Card tone="muted" style={styles.celebration}>
      <PetSprite species="bento" state="cheer" height={88} />
      <View style={styles.celebrationText}>
        <Text style={styles.celebrationTitle}>Rotina em dia!</Text>
        <Text style={styles.small}>Bento anotou tudo na prancheta. Até amanhã.</Text>
      </View>
    </Card> : null}

    {creating ? <Card style={styles.form}>
      <TextField label="Novo hábito" value={title} onChangeText={(text) => { setTitle(text); setError(undefined); }} placeholder="Ex.: Beber 2 copos de água" error={error} maxLength={200} autoFocus />
      <ChipGroup label="Frequência" options={frequencyOptions} value={frequency} onChange={setFrequency} />
      {frequency === 'weekly' ? <ChipGroup label="Dia da semana" options={weekdayOptions} value={String(weekday)} onChange={(value) => setWeekday(Number(value))} /> : null}
      {frequency === 'monthly' ? <Text style={styles.small}>Repete todo dia {new Date().getDate()}. Nos meses mais curtos, cai no último dia.</Text> : null}
      <Button label="Criar hábito" onPress={() => void create()} />
      <Button label="Cancelar" variant="ghost" onPress={() => { setCreating(false); setError(undefined); }} />
    </Card> : <Button label="Novo hábito" variant="secondary" icon="add" onPress={() => setCreating(true)} />}

    {message ? <Text style={styles.small} accessibilityLiveRegion="polite">{message}</Text> : null}

    {habits?.length ? <>
      <SectionHeader title="Seus hábitos" />
      {habits.map((habit) => <HabitCard key={habit.seriesId} habit={habit} rewardKey={rewarded?.seriesId === habit.seriesId ? rewarded.at : undefined} onMark={() => void mark(habit)} />)}
    </> : habits && !creating
      ? <EmptyState species="bento" title="Nenhum hábito ainda" message="Comece com algo que leva dois minutos. Bento cuida da contagem." actionLabel="Criar primeiro hábito" onAction={() => setCreating(true)} />
      : null}
  </Screen>;
}

function HabitCard({ habit, rewardKey, onMark }: { habit: Habit; rewardKey?: number; onMark: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const reward = estimatedReward[habit.difficulty];
  return <Card style={styles.habit}>
    <View style={styles.habitHeader}>
      <View style={styles.habitTitles}>
        <Text style={styles.habitTitle} numberOfLines={2}>{habit.title}</Text>
        <Text style={styles.small}>{habit.label}</Text>
      </View>
      <View style={styles.streak} accessible accessibilityLabel={`Sequência de ${habit.streak}`}>
        <Ionicons name="flame" size={16} color={habit.streak ? colors.tertiary : colors.textDisabled} />
        <Text style={styles.streakValue}>{habit.streak}</Text>
      </View>
    </View>
    <WeekDots days={habit.week} />
    <View style={styles.rateRow}>
      <View style={styles.rateBar}><ProgressBar value={Math.round(habit.rate * 100)} tone="habit" height={6} label="Constância nos últimos 30 dias" /></View>
      <Text style={styles.rate}>{Math.round(habit.rate * 100)}% no mês</Text>
    </View>
    {habit.today ? <Button label={`Marcar hoje · +${reward.xp} XP`} size="compact" icon="checkmark" onPress={onMark} />
      : habit.doneToday ? <Badge tone="success">Feito hoje</Badge>
        : <Text style={styles.small}>Hoje não está na agenda.</Text>}
    <RewardBurst trigger={rewardKey} xp={reward.xp} coins={reward.coins} />
  </Card>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  small: { ...typography.bodySm, color: colors.textSecondary },
  form: { gap: spacing.md },
  celebration: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  celebrationText: { flex: 1, gap: spacing.xs },
  celebrationTitle: { ...typography.title, fontSize: 20, color: colors.text },
  habit: { gap: spacing.ms },
  habitHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  habitTitles: { flex: 1, gap: 2 },
  habitTitle: { ...typography.subheading, color: colors.text },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  streakValue: { ...typography.numeric, fontSize: 14, color: colors.text },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rateBar: { flex: 1 },
  rate: { ...typography.caption, color: colors.textSecondary },
});
