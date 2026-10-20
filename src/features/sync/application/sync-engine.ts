import { ApiError, apiFetch, authenticatedApiFetch } from '../../../shared/network/api-client';
import { secureSession } from '../../../shared/storage/secure-session';
import type { SyncChange, SyncResultStatus } from '../domain/types';
import { applyChanges, deferOperation, getCursor, markOperation, pendingOperations, removeOperation, replaceLocalTaskId } from '../infrastructure/sync-repository';

type PushResult = { opId: string; status: SyncResultStatus; data?: Record<string, unknown>; reason?: string };
type PullResponse = { changes: SyncChange[]; nextCursor: string; hasMore?: boolean; snapshot: boolean };

async function refreshAccessToken() {
  const refreshToken = await secureSession.getRefreshToken();
  if (!refreshToken) throw new Error('Sessão não disponível para sincronização.');
  const response = await apiFetch<{ tokens: { accessToken: string; refreshToken: string } }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  await Promise.all([secureSession.saveAccessToken(response.tokens.accessToken), secureSession.saveRefreshToken(response.tokens.refreshToken)]);
  return response.tokens.accessToken;
}

async function withAccessToken() {
  return (await secureSession.getAccessToken()) ?? refreshAccessToken();
}

async function sendPush(accessToken: string) {
  const operations = await pendingOperations();
  if (!operations.length) return;
  const response = await authenticatedApiFetch<{ results: PushResult[] }>('/sync/push', accessToken, {
    method: 'POST', body: JSON.stringify({ operations: operations.map(({ opId, type, resourceId, baseVersion, payload }) => ({ opId, type, resourceId, baseVersion, payload })) }),
  });
  for (const operation of operations) {
    const result = response.results.find((item) => item.opId === operation.opId);
    if (!result) continue;
    if (result.status === 'applied' || result.status === 'duplicate') {
      if (operation.type === 'task.create' && result.data) await replaceLocalTaskId(operation.resourceId ?? '', result.data);
      await removeOperation(operation.opId);
    } else if (result.status === 'conflict' || result.status === 'rejected') {
      await markOperation(operation, result.status, result);
    }
  }
}

async function pullAll(accessToken: string) {
  let cursor = await getCursor();
  do {
    const query = cursor === undefined ? '' : `?cursor=${encodeURIComponent(cursor)}`;
    const response = await authenticatedApiFetch<PullResponse>(`/sync/pull${query}`, accessToken);
    await applyChanges(response.changes, response.nextCursor);
    cursor = response.nextCursor;
    if (!response.hasMore) break;
  } while (true);
}

export async function synchronize() {
  let accessToken = await withAccessToken();
  try {
    await sendPush(accessToken);
    await pullAll(accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      accessToken = await refreshAccessToken();
      try {
        await sendPush(accessToken);
        await pullAll(accessToken);
        return;
      } catch (retryError) {
        await retryDeferredOperations();
        throw retryError;
      }
    }
    await retryDeferredOperations();
    throw error;
  }
}

export async function retryDeferredOperations() {
  const operations = await pendingOperations();
  for (const operation of operations) await deferOperation(operation, 'Aguardando próxima tentativa de sincronização.');
}
