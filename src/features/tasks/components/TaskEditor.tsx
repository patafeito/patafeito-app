import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../shared/ui/Button';
import { ChipGroup } from '../../../shared/ui/ChipGroup';
import { Dialog } from '../../../shared/ui/Dialog';
import { TextField } from '../../../shared/ui/TextField';
import { useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { spacing, typography } from '../../../shared/theme/tokens';
import { dueAtFor, isOverdue, type DueOption, type Task, type TaskDifficulty } from '../domain/task';
import type { TaskChanges } from '../infrastructure/local-task-repository';

type EditDue = 'keep' | DueOption;

const difficultyOptions: { value: TaskDifficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil · 10 XP' },
  { value: 'medium', label: 'Média · 20 XP' },
  { value: 'hard', label: 'Difícil · 40 XP' },
];
const dueOptions: { value: EditDue; label: string }[] = [
  { value: 'keep', label: 'Manter' },
  { value: 'none', label: 'Sem prazo' },
  { value: 'today', label: 'Hoje' },
  { value: 'tomorrow', label: 'Amanhã' },
];
const rescheduleOptions: { value: EditDue; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'tomorrow', label: 'Amanhã' },
];

type TaskEditorProps = {
  task?: Task;
  onClose: () => void;
  onSave: (task: Task, changes: TaskChanges) => void;
  onDelete: (task: Task) => void;
};

/**
 * Edita uma tarefa pendente. Vencida, só aceita reagendar (RN08); repetida, o prazo segue a regra da série.
 */
export function TaskEditor({ task, onClose, onSave, onDelete }: TaskEditorProps) {
  return <Dialog visible={!!task} onClose={onClose}>
    {task ? <EditorForm key={task.id} task={task} onClose={onClose} onSave={onSave} onDelete={onDelete} /> : null}
  </Dialog>;
}

/** Montado de novo a cada tarefa (`key`), então o estado inicial já vem dela. */
function EditorForm({ task, onClose, onSave, onDelete }: TaskEditorProps & { task: Task }) {
  const styles = useThemedStyles(makeStyles);
  const overdue = isOverdue(task);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(task.difficulty);
  const [due, setDue] = useState<EditDue>(overdue ? 'today' : 'keep');
  const [error, setError] = useState<string>();

  function save() {
    if (overdue) return onSave(task, { dueAt: dueAtFor(due as DueOption) });
    const value = title.trim();
    if (!value) return setError('A tarefa precisa de um título.');
    const changes: TaskChanges = {};
    if (value !== task.title) changes.title = value;
    const text = description.trim() || null;
    if (text !== (task.description ?? null)) changes.description = text;
    if (difficulty !== task.difficulty) changes.difficulty = difficulty;
    if (due !== 'keep') changes.dueAt = dueAtFor(due);
    if (!Object.keys(changes).length) return onClose();
    onSave(task, changes);
  }

  return <>
    <Text style={styles.title} accessibilityRole="header">{overdue ? 'Reagendar tarefa' : 'Editar tarefa'}</Text>
    {overdue
      ? <>
        <Text style={styles.message}>“{task.title}” venceu. Escolha um novo prazo ou exclua a tarefa.</Text>
        <ChipGroup label="Novo prazo" options={rescheduleOptions} value={due} onChange={setDue} />
      </>
      : <>
        <TextField label="Título" value={title} onChangeText={(text) => { setTitle(text); setError(undefined); }} error={error} maxLength={200} />
        <TextField label="Descrição" value={description} onChangeText={setDescription} placeholder="Opcional" multiline maxLength={2000} />
        <ChipGroup label="Dificuldade" options={difficultyOptions} value={difficulty} onChange={setDifficulty} />
        {task.recurrence ? null : <ChipGroup label="Prazo" options={dueOptions} value={due} onChange={setDue} />}
      </>}
    <Button label={overdue ? 'Reagendar' : 'Salvar'} onPress={save} />
    <View style={styles.actions}>
      <View style={styles.action}><Button label="Cancelar" variant="secondary" onPress={onClose} /></View>
      <View style={styles.action}><Button label="Excluir" variant="dangerOutline" icon="trash-outline" onPress={() => onDelete(task)} /></View>
    </View>
  </>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  title: { ...typography.title, fontSize: 22, color: colors.text, textAlign: 'center' },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
