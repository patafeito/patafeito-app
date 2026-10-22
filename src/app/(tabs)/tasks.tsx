import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { syncInBackground } from '../../features/sync/application/sync-startup';
import { synchronize } from '../../features/sync/application/sync-engine';
import { toggleTaskCompletion } from '../../features/tasks/application/toggle-task';
import { estimatedReward, type Task, type TaskDifficulty, type TaskStatus } from '../../features/tasks/domain/task';
import { createLocalTask, listLocalTasks } from '../../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { ChipGroup } from '../../shared/ui/ChipGroup';
import { Screen } from '../../shared/ui/Screen';
import { TaskItem } from '../../shared/ui/TaskItem';
import { TextField } from '../../shared/ui/TextField';
import { colors, spacing, typography } from '../../shared/theme/tokens';

type DueOption = 'none' | 'today' | 'tomorrow';

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
const filterOptions: { value: 'all' | TaskStatus; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'completed', label: 'Concluídas' },
];

function dueAtFor(option: DueOption) {
  if (option === 'none') return null;
  const date = new Date();
  if (option === 'tomorrow') date.setDate(date.getDate() + 1);
  date.setHours(23, 59, 0, 0);
  return date.toISOString();
}

export default function TasksScreen() {
  const { data: tasks, reload } = useLocalData(() => listLocalTasks());
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('easy');
  const [due, setDue] = useState<DueOption>('none');
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);

  const visible = (tasks ?? []).filter((task) => filter === 'all' || task.status === filter);

  async function addTask() {
    const value = title.trim();
    if (!value) return setError('Escreva uma tarefa antes de adicioná-la.');
    setError(undefined);
    await createLocalTask({ title: value, difficulty, dueAt: dueAtFor(due) });
    setTitle('');
    setMessage(`Tarefa salva. Vale ${estimatedReward[difficulty].xp} XP ao concluir.`);
    await reload();
    syncInBackground();
  }

  async function toggle(task: Task) {
    const result = await toggleTaskCompletion(task);
    setMessage(result.message);
    await reload();
    if (result.action === 'completed') router.navigate('/(tabs)');
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

  return <Screen refreshing={refreshing} onRefresh={() => void refresh()}>
    <Text style={styles.title}>Suas tarefas</Text>

    <Card style={styles.form}>
      <TextField label="Nova tarefa" value={title} onChangeText={setTitle} placeholder="Ex.: Ler 10 páginas" returnKeyType="done" onSubmitEditing={() => void addTask()} error={error} maxLength={200} />
      <ChipGroup label="Dificuldade" options={difficultyOptions} value={difficulty} onChange={setDifficulty} />
      <ChipGroup label="Prazo" options={dueOptions} value={due} onChange={setDue} />
      <Button label="Adicionar tarefa" onPress={() => void addTask()} />
    </Card>

    <ChipGroup options={filterOptions} value={filter} onChange={setFilter} />
    {message ? <Text style={styles.message}>{message}</Text> : null}

    <View style={styles.list}>
      {visible.length === 0
        ? <Text style={styles.empty}>{filter === 'completed' ? 'Nada concluído ainda. A primeira vitória vem já.' : 'Ainda não há tarefas. Comece pequeno: uma tarefa clara já é progresso.'}</Text>
        : visible.map((task) => <TaskItem key={task.id} task={task} onPress={() => void toggle(task)} />)}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text, fontSize: 26 },
  form: { gap: spacing.md },
  message: { ...typography.body, color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  list: { gap: spacing.sm },
  empty: { ...typography.body, color: colors.textMuted, fontSize: 15, lineHeight: 22 },
});
