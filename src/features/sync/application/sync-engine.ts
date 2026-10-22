import { authorizedFetch } from '../../../shared/network/authorized-fetch';
import type { QueuedOperation, SyncChange, SyncResultStatus } from '../domain/types';
import {
  applyChanges, deferOperation, getCursor, markFocusSessionSynced, markOperation,
  markTaskSynced, pendingOperations, removeOperation, restoreTaskCompletion, revertTaskCompletion,
} from '../infrastructure/sync-repository';

type PushResult = { opId: string; status: SyncResultStatus; data?: Record<string, unknown>; reason?: string };
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
    else if (operation.type === 'task.complete') await revertTaskCompletion(operation.resourceId);
    else await restoreTaskCompletion(operation.resourceId);
  }
  if (operation.type === 'focus.complete' && operation.resourceId) await markFocusSessionSynced(operation.resourceId, accepted);
  if (accepted) await removeOperation(operation.opId);
  else await markOperation(operation, result.status === 'conflict' ? 'conflict' : 'rejected', result);
}

async function sendPush() {
  const operations = await pendingOperations();
  if (!operations.length) return;
  const response = await authorizedFetch<{ results: PushResult[] }>('/sync/push', {
    method: 'POST',
    body: JSON.stringify({ operations: operations.map(({ opId, type, resourceId, baseVersion, payload }) => ({ opId, type, resourceId, baseVersion, payload })) }),
  });
  for (const operation of operations) {
    const result = response.results.find((item) => item.opId === operation.opId);
    if (result) await applyResult(operation, result);
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
