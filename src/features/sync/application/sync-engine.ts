import { authorizedFetch } from '../../../shared/network/authorized-fetch';
import { showNotice } from '../../../shared/ui/NoticeHost';
import { fetchPet } from '../../pet/infrastructure/pet-api';
import { refreshBalance } from '../../rewards/infrastructure/balance-repository';
import { refreshBoosts, refreshCatalog } from '../../shop/infrastructure/shop-repository';
import type { QueuedOperation, SyncChange, SyncResultStatus } from '../domain/types';
import {
  applyChanges, deferOperation, discardLocalTask, getCursor, markFocusSessionSynced, markOperation,
  markTaskSynced, pendingOperations, removeOperation, restoreTaskCompletion, revertTaskCompletion, sendingOperations,
} from '../infrastructure/sync-repository';

type PushResult = { opId: string; status: SyncResultStatus; data?: Record<string, unknown>; reason?: string; code?: string };
type PullResponse = { changes: SyncChange[]; nextCursor: string; hasMore?: boolean; snapshot: boolean };

const listeners = new Set<() => void>();

export function onSynchronized(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

async function applyResult(operation: QueuedOperation, result: PushResult) {
  const accepted = result.status === 'applied' || result.status === 'duplicate';
  if (operation.resourceId && (operation.type === 'task.complete' || operation.type === 'task.reopen')) {
    if (accepted) await markTaskSynced(operation.resourceId);
    else if (operation.type === 'task.complete') {
      // Concluída offline, mas o servidor recusou (por exemplo, venceu antes do envio): volta para pendente sem XP.
      const title = await revertTaskCompletion(operation.resourceId);
      // Já concluída em outro aparelho: o pull a seguir traz o estado certo, não há o que avisar.
      if (result.code !== 'TASK_NOT_PENDING') showNotice(`“${title ?? 'A tarefa'}” voltou para pendente, sem XP nem moedas. ${result.reason ?? 'O servidor não aceitou a conclusão.'}`, 'warning');
    } else {
      // Desmarcada offline, mas o servidor recusou (moedas já gastas): a tarefa volta e o usuário fica sabendo.
      const title = await restoreTaskCompletion(operation.resourceId);
      showNotice(`“${title ?? 'A tarefa'}” continua concluída. ${result.reason ?? 'O servidor não aceitou desmarcá-la.'}`, 'warning');
    }
  }
  if (operation.type === 'task.create' && operation.resourceId && !accepted) await discardLocalTask(operation.resourceId);
  if (operation.type === 'focus.complete' && operation.resourceId) await markFocusSessionSynced(operation.resourceId, accepted);
  // A refeição já foi aplicada no aparelho: se o servidor recusou, volta ao pet e ao saldo reais.
  if (operation.type === 'pet.feed' && !accepted) await Promise.all([fetchPet(), refreshBalance()]).catch(() => undefined);
  if (accepted) await removeOperation(operation.opId);
  else await markOperation(operation, result.status === 'conflict' ? 'conflict' : 'rejected', result);
}

async function sendPush() {
  const operations = await pendingOperations();
  if (!operations.length) return;
  for (const operation of operations) sendingOperations.add(operation.opId);
  try {
    const response = await authorizedFetch<{ results: PushResult[] }>('/sync/push', {
      method: 'POST',
      body: JSON.stringify({ operations: operations.map(({ opId, type, resourceId, baseVersion, payload }) => ({ opId, type, resourceId, baseVersion, payload })) }),
    });
    for (const operation of operations) {
      const result = response.results.find((item) => item.opId === operation.opId);
      if (result) await applyResult(operation, result);
    }
  } finally {
    for (const operation of operations) sendingOperations.delete(operation.opId);
  }
}

async function pullAll() {
  let cursor = await getCursor();
  for (;;) {
    const query = cursor === undefined ? '' : `?cursor=${encodeURIComponent(cursor)}`;
    const response = await authorizedFetch<PullResponse>(`/sync/pull${query}`);
    await applyChanges(response.changes, response.nextCursor);
    cursor = response.nextCursor;
    if (!response.hasMore) break;
  }
}

export async function synchronize() {
  try {
    await sendPush();
    await pullAll();
    // Catálogo e poderes não passam pelo log de mudanças: são relidos a cada sincronização.
    await Promise.all([refreshCatalog(), refreshBoosts()]).catch(() => undefined);
  } catch (error) {
    await retryDeferredOperations();
    throw error;
  } finally {
    for (const listener of listeners) listener();
  }
}

export async function retryDeferredOperations() {
  const operations = await pendingOperations();
  for (const operation of operations) await deferOperation(operation, 'Aguardando próxima tentativa de sincronização.');
}
