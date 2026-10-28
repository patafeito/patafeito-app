import { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { syncInBackground } from '../../features/sync/application/sync-startup';
import { synchronize } from '../../features/sync/application/sync-engine';
import { toggleTaskCompletion } from '../../features/tasks/application/toggle-task';
import { parseMonthDay, recurrenceLabel, weekdayLabels, type Recurrence, type RecurrenceRule } from '../../features/tasks/domain/recurrence';
import { TaskEditor } from '../../features/tasks/components/TaskEditor';
import { dueAtFor, estimatedReward, type DueOption, type Task, type TaskDifficulty, type TaskStatus } from '../../features/tasks/domain/task';
import { createLocalTask, deleteLocalTask, ensureRecurringOccurrences, listLocalTasks, updateLocalTask, type TaskChanges } from '../../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { ChipGroup } from '../../shared/ui/ChipGroup';
import { useConfirm } from '../../shared/ui/ConfirmDialog';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ScreenHeader } from '../../shared/ui/Headers';
import { Screen } from '../../shared/ui/Screen';
import { TaskItem } from '../../shared/ui/TaskItem';
import { TextField } from '../../shared/ui/TextField';
import { useTheme, useThemedStyles, type Theme } from '../../shared/theme/ThemeProvider';
import { spacing, typography } from '../../shared/theme/tokens';

type RepeatOption = 'none' | Recurrence;

const difficultyOptions: { value: TaskDifficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil · 10 XP' },
  { value: 'medium', label: 'Média · 20 XP' },
  { value: 'hard', label: 'Difícil · 40 XP' },
];
const dueOptions: { value: DueOption; label: string }[] = [
  { value: 'none', label: 'Sem prazo' },
  { value: 'today', label: 'Hoje' },
  { value: 'tomorrow', label: 'Amanhã' },
];
const repeatOptions: { value: RepeatOption; label: string }[] = [
  { value: 'none', label: 'Não repete' },
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
];
const weekdayOptions = weekdayLabels.map((label, day) => ({ value: String(day), label }));
const filterOptions: { value: 'all' | TaskStatus; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'completed', label: 'Concluídas' },
];

function ruleFor(repeat: RepeatOption, weekday: number, monthDay: number): RecurrenceRule | null {
  if (repeat === 'none') return null;
  if (repeat === 'daily') return { recurrence: 'daily', recurrenceDay: null };
  return { recurrence: repeat, recurrenceDay: repeat === 'weekly' ? weekday : monthDay };
}

async function loadTasks() {
  if (await ensureRecurringOccurrences()) syncInBackground();
  return listLocalTasks();
}

export default function TasksScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { data: tasks, reload } = useLocalData(loadTasks);
  const [filter, setFilter] = useState<'all' | TaskStatus>('pending');
  const [title, setTitle] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('easy');
  const [due, setDue] = useState<DueOption>('none');
  const [repeat, setRepeat] = useState<RepeatOption>('none');
  const [weekday, setWeekday] = useState(() => new Date().getDay());
  const [monthDay, setMonthDay] = useState(() => String(new Date().getDate()));
  const [monthDayError, setMonthDayError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<Task>();
  const { confirm, dialog } = useConfirm();

  const visible = (tasks ?? []).filter((task) => filter === 'all' || task.status === filter);
  const pendingCount = (tasks ?? []).filter((task) => task.status === 'pending').length;

  function toggleOptions() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowOptions((value) => !value);
  }

  async function addTask() {
    const value = title.trim();
    if (!value) return setError('Escreva uma tarefa antes de adicioná-la.');
    setError(undefined);
    const day = parseMonthDay(monthDay);
    if (repeat === 'monthly' && day === undefined) return setMonthDayError('Digite um dia do mês entre 1 e 31.');
    setMonthDayError(undefined);
    const rule = ruleFor(repeat, weekday, day ?? 1);
    await createLocalTask({ title: value, difficulty, dueAt: dueAtFor(due), rule });
    setTitle('');
    setMessage(rule
      ? `Tarefa salva: ${recurrenceLabel(rule).toLowerCase()}. Cada repetição vale ${estimatedReward[difficulty].xp} XP.`
      : `Tarefa salva. Vale ${estimatedReward[difficulty].xp} XP ao concluir.`);
    await reload();
    syncInBackground();
  }

  async function toggle(task: Task) {
    const result = await toggleTaskCompletion(task);
    setMessage(result.message);
    await reload();
    // Espera o "+XP" aparecer antes de levar ao pato comemorando.
    if (result.action === 'completed') setTimeout(() => router.navigate('/(tabs)'), 700);
  }

  /** Pendente abre o editor; concluída só pode ser excluída. */
  function openOptions(task: Task) {
    if (task.status === 'pending') setEditing(task);
    else confirmDelete(task);
  }

  async function save(task: Task, changes: TaskChanges) {
    setEditing(undefined);
    await updateLocalTask(task, changes);
    setMessage(changes.dueAt !== undefined && Object.keys(changes).length === 1 ? `“${task.title}” foi reagendada.` : 'Tarefa atualizada.');
    await reload();
    syncInBackground();
  }

  function confirmDelete(task: Task) {
    setEditing(undefined);
    const repeating = !!task.recurrence && task.status === 'pending';
    confirm({
      title: 'Excluir tarefa?',
      message: repeating ? `“${task.title}” deixa de se repetir.` : `“${task.title}” sai da sua lista.`,
      confirmLabel: 'Excluir',
      destructive: true,
      onConfirm: () => void remove(task),
    });
  }

  async function remove(task: Task) {
    await deleteLocalTask(task);
    setMessage(`“${task.title}” foi excluída.`);
    await reload();
    syncInBackground();
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await synchronize();
      setMessage(undefined);
    } catch {
      setMessage('Sem conexão. Suas alterações continuam salvas neste aparelho.');
    } finally {
      setRefreshing(false);
      await reload();
    }
  }

  return <Screen refreshing={refreshing} onRefresh={() => void refresh()} edges={['top', 'left', 'right']}>
    <ScreenHeader title="Tarefas" subtitle={pendingCount ? `${pendingCount} ${pendingCount === 1 ? 'pendente' : 'pendentes'}` : 'Nada pendente'} />

    <Card style={styles.form}>
      <TextField label="Nova tarefa" value={title} onChangeText={setTitle} placeholder="Ex.: Ler 10 páginas" returnKeyType="done" onSubmitEditing={() => void addTask()} error={error} maxLength={200} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showOptions }} onPress={toggleOptions} style={styles.optionsToggle} hitSlop={8}>
        <Text style={styles.optionsLabel}>{showOptions ? 'Menos opções' : `Dificuldade, prazo e repetição · ${difficultyOptions.find((option) => option.value === difficulty)?.label}`}</Text>
        <Ionicons name={showOptions ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
      </Pressable>
      {showOptions ? <View style={styles.options}>
        <ChipGroup label="Dificuldade" options={difficultyOptions} value={difficulty} onChange={setDifficulty} />
        <ChipGroup label="Repetição" options={repeatOptions} value={repeat} onChange={setRepeat} />
        {repeat === 'weekly' ? <ChipGroup label="Dia da semana" options={weekdayOptions} value={String(weekday)} onChange={(value) => setWeekday(Number(value))} /> : null}
        {repeat === 'monthly' ? <TextField
          label="Dia do mês"
          value={monthDay}
          onChangeText={(text) => { setMonthDay(text); setMonthDayError(undefined); }}
          placeholder="1 a 31"
          keyboardType="number-pad"
          maxLength={2}
          error={monthDayError}
          hint={(parseMonthDay(monthDay) ?? 0) > 28 ? 'Nos meses mais curtos, a tarefa cai no último dia.' : 'Um número de 1 a 31.'}
        /> : null}
        {repeat === 'none' ? <ChipGroup label="Prazo" options={dueOptions} value={due} onChange={setDue} /> : null}
      </View> : null}
      <Button label="Adicionar tarefa" icon="add" onPress={() => void addTask()} />
    </Card>

    <ChipGroup variant="segmented" options={filterOptions} value={filter} onChange={setFilter} />
    {message ? <Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text> : null}

    <View style={styles.list}>
      {visible.length === 0
        ? filter === 'completed'
          ? <EmptyState species="pingo" state="happy" title="Nada concluído ainda" message="A primeira vitória vem já. Escolha a menor tarefa da lista." />
          : <EmptyState species="pingo" title="Lista limpinha" message="Comece pequeno: uma tarefa clara já é progresso." />
        : visible.map((task) => <TaskItem key={task.id} task={task} onPress={() => void toggle(task)} onLongPress={openOptions} />)}
    </View>
    {visible.length ? <Text style={styles.tip}>Toque para concluir · segure para editar</Text> : null}
    <TaskEditor task={editing} onClose={() => setEditing(undefined)} onSave={(task, changes) => void save(task, changes)} onDelete={confirmDelete} />
    {dialog}
  </Screen>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  form: { gap: spacing.md },
  optionsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, minHeight: 32 },
  optionsLabel: { ...typography.label, color: colors.primary, flexShrink: 1 },
  options: { gap: spacing.md },
  message: { ...typography.bodySm, color: colors.textSecondary },
  list: { gap: spacing.sm },
  tip: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
