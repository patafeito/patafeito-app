import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { createLocalTask, listLocalTasks } from '../../features/tasks/infrastructure/local-task-repository';
import { synchronize } from '../../features/sync/application/sync-engine';
import type { Task } from '../../features/tasks/domain/task';
import { Button } from '../../shared/ui/Button';
import { Screen } from '../../shared/ui/Screen';
import { colors, spacing } from '../../shared/theme/tokens';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() { setTasks(await listLocalTasks()); }
  useEffect(() => {
    let active = true;
    void listLocalTasks().then((items) => { if (active) setTasks(items); });
    return () => { active = false; };
  }, []);

  async function addTask() {
    const value = title.trim();
    if (!value) return setMessage('Escreva uma tarefa antes de adicioná-la.');
    await createLocalTask({ title: value, difficulty: 'easy' });
    setTitle('');
    setMessage('Tarefa salva no aparelho e aguardando sincronização.');
    await refresh();
  }

  async function sync() {
    try {
      await synchronize();
      setMessage('Sincronização concluída.');
      await refresh();
    } catch {
      setMessage('Sem conexão ou sessão válida. A tarefa continua salva neste aparelho.');
    }
  }

  return <Screen>
    <Text style={styles.title}>Suas tarefas</Text>
    <TextInput value={title} onChangeText={setTitle} placeholder="Ex.: Beber água" placeholderTextColor={colors.textMuted} style={styles.input} returnKeyType="done" onSubmitEditing={() => void addTask()} />
    <Button label="Adicionar tarefa" onPress={() => void addTask()} />
    <Button label="Sincronizar agora" onPress={() => void sync()} />
    {message ? <Text style={styles.message}>{message}</Text> : null}
    <View style={styles.list}>
      {tasks.length === 0 ? <Text style={styles.empty}>Ainda não há tarefas. Comece pequeno: uma tarefa clara já é progresso.</Text> : tasks.map((task) => <View key={task.id} style={styles.task}><Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.meta}>{task.difficulty === 'easy' ? 'Fácil' : task.difficulty === 'medium' ? 'Média' : 'Difícil'}</Text></View>)}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  input: { color: colors.text, borderColor: colors.textMuted, borderWidth: 1, borderRadius: 12, padding: spacing.md, fontSize: 16 },
  message: { color: colors.textMuted, lineHeight: 20 },
  list: { gap: spacing.sm, marginTop: spacing.sm },
  empty: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  task: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, gap: 4 },
  taskTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 13 },
});
