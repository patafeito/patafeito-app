import { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { syncInBackground } from '../../features/sync/application/sync-startup';
import { synchronize } from '../../features/sync/application/sync-engine';
import { toggleTaskCompletion } from '../../features/tasks/application/toggle-task';
import { parseMonthDay, recurrenceLabel, weekdayLabels, type Recurrence, type RecurrenceRule } from '../../features/tasks/domain/recurrence';
import { TaskEditor } from '../../features/tasks/components/TaskEditor';
import { categoryOptions, difficultyOptions } from '../../features/tasks/domain/options';
import {
  dueAtFor, ESTIMATE_MINUTES_RANGE, estimatedReward, matchesSearch, parseEstimate, SPECIAL_WEEKLY_LIMIT,
  type DueOption, type Task, type TaskCategory, type TaskDifficulty, type TaskStatus,
} from '../../features/tasks/domain/task';
import {
  countSpecialThisWeek, createLocalTask, deleteLocalTask, ensureRecurringOccurrences, listLocalTasks, listReusableTasks, updateLocalTask, type TaskChanges,
} from '../../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { ChipGroup } from '../../shared/ui/ChipGroup';
import { useConfirm } from '../../shared/ui/ConfirmDialog';
import { Dialog } from '../../shared/ui/Dialog';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ScreenHeader } from '../../shared/ui/Headers';
import { Screen } from '../../shared/ui/Screen';
import { TaskItem } from '../../shared/ui/TaskItem';
import { TextField } from '../../shared/ui/TextField';
import { useTheme, useThemedStyles, type Theme } from '../../shared/theme/ThemeProvider';
import { spacing, typography } from '../../shared/theme/tokens';

type RepeatOption = 'none' | Recurrence;

const dueOptions: { value: DueOption; label: string }[] = [
  { value: 'none', label: 'Sem prazo' },
  { value: 'today', label: 'Hoje' },
  { value: 'tomorrow', label: 'Amanhã' },
  { value: 'week', label: 'Esta semana' },
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
  const [tasks, reusable, specialUsed] = await Promise.all([listLocalTasks(), listReusableTasks(), countSpecialThisWeek()]);
  return { tasks, reusable, specialUsed };
}

export default function TasksScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { data, reload } = useLocalData(loadTasks);
  // Atalho "Nova tarefa" da Home: já abre com o campo de título em foco.
  const { new: startNew } = useLocalSearchParams<{ new?: string }>();
  const [filter, setFilter] = useState<'all' | TaskStatus>('pending');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  // Sem valor inicial: a dificuldade é escolha obrigatória (RN10).
  const [difficulty, setDifficulty] = useState<TaskDifficulty>();
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [estimate, setEstimate] = useState('');
  const [estimateError, setEstimateError] = useState<string>();
  const [special, setSpecial] = useState(false);
  const [due, setDue] = useState<DueOption>('none');
  const [repeat, setRepeat] = useState<RepeatOption>('none');
  const [weekday, setWeekday] = useState(() => new Date().getDay());
  const [monthDay, setMonthDay] = useState(() => String(new Date().getDate()));
  const [monthDayError, setMonthDayError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<Task>();
  const [doneOptions, setDoneOptions] = useState<Task>();
  const { confirm, dialog } = useConfirm();

  const tasks = data?.tasks ?? [];
  const specialLeft = Math.max(0, SPECIAL_WEEKLY_LIMIT - (data?.specialUsed ?? 0));
  const visible = tasks.filter((task) => (filter === 'all' || task.status === filter) && matchesSearch(task, query));
  const pendingCount = tasks.filter((task) => task.status === 'pending').length;
  const reusable = title.trim() ? [] : data?.reusable ?? [];

  function toggleOptions() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowOptions((value) => !value);
  }

  /** Reaproveita uma tarefa já feita (HU11): o formulário volta preenchido, pronto para ajustar o prazo. */
  function reuse(task: Task) {
    setDoneOptions(undefined);
    setTitle(task.title);
    setDescription(task.description ?? null);
    setDifficulty(task.difficulty);
    setCategory(task.category ?? 'personal');
    setEstimate(task.estimatedMinutes ? String(task.estimatedMinutes) : '');
    setSpecial(false);
    setError(undefined);
    setMessage(`“${task.title}” está no formulário. Ajuste o prazo e adicione.`);
  }

  function toggleSpecial(value: boolean) {
    setSpecial(value);
    if (value) setRepeat('none');
  }

  async function addTask() {
    const value = title.trim();
    if (!value) return setError('Escreva uma tarefa antes de adicioná-la.');
    if (!difficulty) return setError('Escolha a dificuldade da tarefa.');
    setError(undefined);
    const minutes = parseEstimate(estimate);
    if (minutes === undefined) {
      setShowOptions(true);
      return setEstimateError(`Digite de ${ESTIMATE_MINUTES_RANGE.min} a ${ESTIMATE_MINUTES_RANGE.max} minutos, ou deixe em branco.`);
    }
    setEstimateError(undefined);
    const day = parseMonthDay(monthDay);
    if (repeat === 'monthly' && day === undefined) return setMonthDayError('Digite um dia do mês entre 1 e 31.');
    setMonthDayError(undefined);
    if (special && !specialLeft) return setError(`Você já criou ${SPECIAL_WEEKLY_LIMIT} tarefas especiais nesta semana.`);
    const rule = special ? null : ruleFor(repeat, weekday, day ?? 1);
    await createLocalTask({
      title: value, description, difficulty, dueAt: dueAtFor(due), rule, category, estimatedMinutes: minutes, kind: special ? 'special' : 'normal',
    });
    setTitle('');
    setDescription(null);
    setDifficulty(undefined);
    setEstimate('');
    setSpecial(false);
    setMessage(special
      ? 'Tarefa especial salva. Ela não vale XP, mas o pato vai reagir de um jeito raro.'
      : rule
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

  /** Pendente abre o editor; concluída pode ser reaproveitada ou excluída. */
  function openOptions(task: Task) {
    if (task.status === 'pending') setEditing(task);
    else setDoneOptions(task);
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
    setDoneOptions(undefined);
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

  const summary = [categoryOptions.find((option) => option.value === category)?.label, special ? 'Especial' : null].filter(Boolean).join(' · ');

  return <Screen refreshing={refreshing} onRefresh={() => void refresh()} edges={['top', 'left', 'right']}>
    <ScreenHeader title="Tarefas" subtitle={pendingCount ? `${pendingCount} ${pendingCount === 1 ? 'pendente' : 'pendentes'}` : 'Nada pendente'} />

    <Card style={styles.form}>
      <TextField key={startNew ? 'new' : 'idle'} autoFocus={startNew === '1'} label="Nova tarefa" value={title} onChangeText={(text) => { setTitle(text); setError(undefined); }} placeholder="Ex.: Ler 10 páginas" returnKeyType="done" onSubmitEditing={() => void addTask()} error={error} maxLength={200} />
      {reusable.length ? <ChipGroup
        label="Reaproveitar uma tarefa feita"
        options={reusable.map((task) => ({ value: task.id, label: task.title }))}
        value={undefined}
        onChange={(id) => { const task = reusable.find((item) => item.id === id); if (task) reuse(task); }}
      /> : null}
      <ChipGroup label="Dificuldade (obrigatória)" options={difficultyOptions} value={difficulty} onChange={(value) => { setDifficulty(value); setError(undefined); }} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showOptions }} onPress={toggleOptions} style={styles.optionsToggle} hitSlop={8}>
        <Text style={styles.optionsLabel}>{showOptions ? 'Menos opções' : `Categoria, prazo, estimativa e repetição · ${summary}`}</Text>
        <Ionicons name={showOptions ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
      </Pressable>
      {showOptions ? <View style={styles.options}>
        <ChipGroup label="Categoria" options={categoryOptions} value={category} onChange={setCategory} />
        <TextField
          label="Estimativa (minutos)"
          value={estimate}
          onChangeText={(text) => { setEstimate(text); setEstimateError(undefined); }}
          placeholder="Opcional, ex.: 25"
          keyboardType="number-pad"
          maxLength={3}
          error={estimateError}
        />
        {special ? null : <ChipGroup label="Repetição" options={repeatOptions} value={repeat} onChange={setRepeat} />}
        {!special && repeat === 'weekly' ? <ChipGroup label="Dia da semana" options={weekdayOptions} value={String(weekday)} onChange={(value) => setWeekday(Number(value))} /> : null}
        {!special && repeat === 'monthly' ? <TextField
          label="Dia do mês"
          value={monthDay}
          onChangeText={(text) => { setMonthDay(text); setMonthDayError(undefined); }}
          placeholder="1 a 31"
          keyboardType="number-pad"
          maxLength={2}
          error={monthDayError}
          hint={(parseMonthDay(monthDay) ?? 0) > 28 ? 'Nos meses mais curtos, a tarefa cai no último dia.' : 'Um número de 1 a 31.'}
        /> : null}
        {special || repeat === 'none' ? <ChipGroup label="Prazo" options={dueOptions} value={due} onChange={setDue} /> : null}
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>Tarefa especial</Text>
            <Text style={styles.switchDescription}>
              {specialLeft ? `Para eventos únicos. Não vale XP, mas o pato reage de um jeito raro. Restam ${specialLeft} nesta semana.` : `Você já usou as ${SPECIAL_WEEKLY_LIMIT} tarefas especiais desta semana.`}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Tarefa especial"
            accessibilityHint={`Não vale XP. Restam ${specialLeft} nesta semana.`}
            value={special}
            disabled={!specialLeft && !special}
            onValueChange={toggleSpecial}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.borderStrong}
          />
        </View>
      </View> : null}
      <Button label="Adicionar tarefa" icon="add" disabled={!difficulty} onPress={() => void addTask()} />
    </Card>

    <TextField label="Buscar" value={query} onChangeText={setQuery} placeholder="Pesquisar tarefas..." returnKeyType="search" maxLength={100} accessibilityLabel="Pesquisar tarefas pelo nome" />
    <ChipGroup variant="segmented" options={filterOptions} value={filter} onChange={setFilter} />
    {message ? <Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text> : null}

    <View style={styles.list}>
      {visible.length === 0
        ? query.trim()
          ? <EmptyState species="pingo" title="Nada encontrado" message={`Nenhuma tarefa com “${query.trim()}” neste filtro.`} />
          : filter === 'completed'
            ? <EmptyState species="pingo" state="happy" title="Nada concluído ainda" message="A primeira vitória vem já. Escolha a menor tarefa da lista." />
            : <EmptyState species="pingo" title="Lista limpinha" message="Comece pequeno: uma tarefa clara já é progresso." />
        : visible.map((task) => <TaskItem key={task.id} task={task} onPress={() => void toggle(task)} onLongPress={openOptions} />)}
    </View>
    {visible.length ? <Text style={styles.tip}>Toque para concluir · segure para editar ou reaproveitar</Text> : null}
    <TaskEditor task={editing} onClose={() => setEditing(undefined)} onSave={(task, changes) => void save(task, changes)} onDelete={confirmDelete} />
    <Dialog visible={!!doneOptions} onClose={() => setDoneOptions(undefined)}>
      {doneOptions ? <>
        <Text style={styles.dialogTitle} accessibilityRole="header">“{doneOptions.title}”</Text>
        <Text style={styles.dialogMessage}>Tarefa concluída. Quer fazer de novo ou tirar da lista?</Text>
        <Button label="Reaproveitar" icon="repeat" onPress={() => reuse(doneOptions)} />
        <View style={styles.dialogActions}>
          <View style={styles.dialogAction}><Button label="Cancelar" variant="secondary" onPress={() => setDoneOptions(undefined)} /></View>
          <View style={styles.dialogAction}><Button label="Excluir" variant="dangerOutline" icon="trash-outline" onPress={() => confirmDelete(doneOptions)} /></View>
        </View>
      </> : null}
    </Dialog>
    {dialog}
  </Screen>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  form: { gap: spacing.md },
  optionsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, minHeight: 32 },
  optionsLabel: { ...typography.label, color: colors.primary, flexShrink: 1 },
  options: { gap: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchText: { flex: 1, gap: spacing.xs },
  switchLabel: { ...typography.label, color: colors.text },
  switchDescription: { ...typography.bodySm, color: colors.textSecondary },
  message: { ...typography.bodySm, color: colors.textSecondary },
  list: { gap: spacing.sm },
  tip: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  dialogTitle: { ...typography.title, fontSize: 22, color: colors.text, textAlign: 'center' },
  dialogMessage: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  dialogActions: { flexDirection: 'row', gap: spacing.sm },
  dialogAction: { flex: 1 },
});
