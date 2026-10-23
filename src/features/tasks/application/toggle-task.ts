import { ApiError, NetworkError } from '../../../shared/network/api-client';
import { authorizedFetch } from '../../../shared/network/authorized-fetch';
import { celebrate } from '../../pet/application/pet-mood';
import type { Pet } from '../../pet/domain/pet';
import { saveLocalPet } from '../../pet/infrastructure/local-pet-repository';
import { refreshBalance } from '../../rewards/infrastructure/balance-repository';
import { syncInBackground } from '../../sync/application/sync-startup';
import { applyServerReopen, cancelPendingCompletion, completeLocalTask, queueLocalReopen } from '../infrastructure/local-task-repository';
import { isOverdue, type Task } from '../domain/task';

export type ToggleResult = {
  action: 'completed' | 'reopened' | 'blocked';
  message: string;
};

type ReopenResponse = { task: { version: number }; refunded: { xp: number; coins: number }; pet: Pet };

/**
 * Desmarcar pergunta ao servidor primeiro: ele recusa quando as moedas da tarefa já foram gastas,
 * e assim a tarefa nem chega a sair da lista. Sem conexão, o pedido vai para a fila.
 */
async function reopen(task: Task): Promise<ToggleResult> {
  if (await cancelPendingCompletion(task)) {
    syncInBackground();
    return { action: 'reopened', message: `“${task.title}” voltou para a lista. A conclusão nem chegou a ser enviada.` };
  }
  try {
    const result = await authorizedFetch<ReopenResponse>(`/tasks/${task.id}/reopen`, { method: 'POST' });
    await applyServerReopen(task.id, result.task.version);
    await saveLocalPet(result.pet);
    await refreshBalance().catch(() => undefined);
    const { xp, coins } = result.refunded;
    return { action: 'reopened', message: `“${task.title}” voltou para a lista. -${xp} XP e -${coins} ${coins === 1 ? 'moeda' : 'moedas'}.` };
  } catch (error) {
    if (error instanceof NetworkError) {
      await queueLocalReopen(task);
      return { action: 'reopened', message: `“${task.title}” voltou para a lista. O XP e as moedas serão estornados na sincronização.` };
    }
    if (error instanceof ApiError && error.status === 409) return { action: 'blocked', message: error.message };
    return { action: 'blocked', message: 'Não foi possível desmarcar agora. Tente de novo em instantes.' };
  }
}

export async function toggleTaskCompletion(task: Task): Promise<ToggleResult> {
  if (task.status === 'completed') return reopen(task);

  if (isOverdue(task)) return { action: 'blocked', message: 'Esta tarefa venceu. Reagende antes de concluir.' };

  const reward = await completeLocalTask(task);
  syncInBackground();
  celebrate('cheer', { message: `Patafeito! +${reward.xp} XP e ${reward.coins} moedas, a confirmar.` });
  return { action: 'completed', message: `Patafeito! +${reward.xp} XP e ${reward.coins} moedas, a confirmar.` };
}
