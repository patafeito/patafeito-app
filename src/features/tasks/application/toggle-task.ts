import { celebrate } from '../../pet/application/pet-mood';
import { syncInBackground } from '../../sync/application/sync-startup';
import { completeLocalTask, reopenLocalTask } from '../infrastructure/local-task-repository';
import { isOverdue, type Task } from '../domain/task';

export type ToggleResult = {
  action: 'completed' | 'reopened' | 'blocked';
  message: string;
};

export async function toggleTaskCompletion(task: Task): Promise<ToggleResult> {
  if (task.status === 'completed') {
    const { cancelled } = await reopenLocalTask(task);
    syncInBackground();
    return {
      action: 'reopened',
      message: cancelled
        ? `“${task.title}” voltou para a lista. A conclusão nem chegou a ser enviada.`
        : `“${task.title}” voltou para a lista. O XP e as moedas serão estornados na sincronização.`,
    };
  }

  if (isOverdue(task)) return { action: 'blocked', message: 'Esta tarefa venceu. Reagende antes de concluir.' };

  const reward = await completeLocalTask(task);
  syncInBackground();
  celebrate('cheer', { message: `Patafeito! +${reward.xp} XP e ${reward.coins} moedas, a confirmar.` });
  return { action: 'completed', message: `Patafeito! +${reward.xp} XP e ${reward.coins} moedas, a confirmar.` };
}
