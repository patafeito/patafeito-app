import { getDatabase } from '../../../db/client';
import { newId } from '../../../shared/utils/identifier';
import type { QueuedOperation, SyncChange, SyncOperationType } from '../domain/types';

const cursorKey = 'sync.cursor';

/** Operações do push em andamento; não podem mais ser alteradas na fila. */
export const sendingOperations = new Set<string>();

export async function enqueueOperation(type: SyncOperationType, payload: Record<string, unknown>, options?: { resourceId?: string; baseVersion?: number }) {
  const database = await getDatabase();
  const opId = newId();
  await database.runAsync(
    'INSERT INTO sync_queue (op_id, operation_type, resource_id, base_version, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    opId, type, options?.resourceId ?? null, options?.baseVersion ?? null, JSON.stringify(payload), Date.now(),
  );
  return opId;
}

export async function pendingOperations(limit = 50): Promise<QueuedOperation[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ op_id: string; operation_type: SyncOperationType; resource_id: string | null; base_version: number | null; payload: string; attempts: number }>(
    "SELECT op_id, operation_type, resource_id, base_version, payload, attempts FROM sync_queue WHERE state = 'pending' AND next_attempt_at <= ? ORDER BY created_at LIMIT ?", Date.now(), limit,
  );
  return rows.map((row) => ({ opId: row.op_id, type: row.operation_type, resourceId: row.resource_id ?? undefined, baseVersion: row.base_version ?? undefined, payload: JSON.parse(row.payload) as Record<string, unknown>, attempts: row.attempts }));
}

export async function removeOperation(opId: string) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM sync_queue WHERE op_id = ?', opId);
}

export async function discardPendingOperation(type: SyncOperationType, resourceId: string) {
  const database = await getDatabase();
  const result = await database.runAsync(
    "DELETE FROM sync_queue WHERE state = 'pending' AND operation_type = ? AND resource_id = ?", type, resourceId,
  );
  return result.changes > 0;
}

/**
 * Junta `changes` à criação ou edição desta tarefa que ainda está na fila, para não mandar duas
 * edições com a mesma versão-base (a segunda viraria conflito). Devolve se encontrou uma.
 */
export async function mergeIntoPendingTaskOperation(resourceId: string, changes: Record<string, unknown>) {
  const database = await getDatabase();
  // Só operações que nunca saíram do aparelho: uma já enviada pode ter sido aplicada com o payload antigo.
  const rows = await database.getAllAsync<{ op_id: string; payload: string }>(
    "SELECT op_id, payload FROM sync_queue WHERE state = 'pending' AND attempts = 0 AND resource_id = ? AND operation_type IN ('task.create', 'task.update') ORDER BY created_at DESC",
    resourceId,
  );
  const row = rows.find((candidate) => !sendingOperations.has(candidate.op_id));
  if (!row) return false;
  const payload = { ...(JSON.parse(row.payload) as Record<string, unknown>), ...changes };
  await database.runAsync('UPDATE sync_queue SET payload = ? WHERE op_id = ?', JSON.stringify(payload), row.op_id);
  return true;
}

export async function deferOperation(operation: QueuedOperation, error: string) {
  const database = await getDatabase();
  const attempts = operation.attempts + 1;
  const delay = Math.min(1_000 * 2 ** attempts, 60 * 60 * 1_000);
  await database.runAsync('UPDATE sync_queue SET attempts = ?, next_attempt_at = ?, conflict_data = ? WHERE op_id = ?', attempts, Date.now() + delay, error, operation.opId);
}

export async function markOperation(operation: QueuedOperation, state: 'conflict' | 'rejected', data: unknown) {
  const database = await getDatabase();
  await database.runAsync('UPDATE sync_queue SET state = ?, conflict_data = ? WHERE op_id = ?', state, JSON.stringify(data), operation.opId);
}

export async function listConflicts() {
  const database = await getDatabase();
  return database.getAllAsync<{ op_id: string; operation_type: SyncOperationType; resource_id: string | null; conflict_data: string }>("SELECT op_id, operation_type, resource_id, conflict_data FROM sync_queue WHERE state = 'conflict' ORDER BY created_at");
}

export async function getCursor() {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM sync_state WHERE key = ?', cursorKey);
  return row?.value;
}

export async function applyChanges(changes: SyncChange[], cursor: string) {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    for (const change of changes) {
      if (change.entityType === 'task') {
        if (change.changeType === 'delete') {
          await database.runAsync("UPDATE local_tasks SET deleted_at = ?, sync_state = 'synced' WHERE id = ?", String(change.data.deletedAt ?? new Date().toISOString()), change.entityId);
        } else {
          const task = change.data;
          await database.runAsync(`INSERT INTO local_tasks (id, title, description, difficulty, status, due_at, completed_at, version, updated_at, deleted_at, recurrence, recurrence_day, series_id, category, estimated_minutes, kind, created_at, sync_state)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
            ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description, difficulty = excluded.difficulty, status = excluded.status, due_at = excluded.due_at, completed_at = excluded.completed_at, version = excluded.version, updated_at = excluded.updated_at, deleted_at = excluded.deleted_at, recurrence = excluded.recurrence, recurrence_day = excluded.recurrence_day, series_id = excluded.series_id, category = excluded.category, estimated_minutes = excluded.estimated_minutes, kind = excluded.kind, created_at = COALESCE(local_tasks.created_at, excluded.created_at), sync_state = 'synced'`,
          String(task.id), String(task.title), task.description == null ? null : String(task.description), String(task.difficulty), String(task.status), task.dueAt == null ? null : String(task.dueAt), task.completedAt == null ? null : String(task.completedAt), Number(task.version), String(task.updatedAt ?? new Date().toISOString()), task.deletedAt == null ? null : String(task.deletedAt), task.recurrence == null ? null : String(task.recurrence), task.recurrenceDay == null ? null : Number(task.recurrenceDay), task.seriesId == null ? null : String(task.seriesId), task.category == null ? 'personal' : String(task.category), task.estimatedMinutes == null ? null : Number(task.estimatedMinutes), task.kind == null ? 'normal' : String(task.kind), task.createdAt == null ? null : String(task.createdAt));
        }
      } else {
        const table = change.entityType === 'pet' ? 'local_pets' : change.entityType === 'inventory' ? 'local_inventory' : 'local_notifications';
        await database.runAsync(`INSERT INTO ${table} (id, payload, version) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, version = excluded.version`, change.entityId, JSON.stringify(change.data), change.version);
      }
    }
    await database.runAsync('INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', cursorKey, cursor);
  });
}

/** O servidor recusou a criação (por exemplo, repetição já excluída em outro aparelho): some com a cópia local. */
export async function discardLocalTask(taskId: string) {
  const database = await getDatabase();
  await database.runAsync("UPDATE local_tasks SET deleted_at = COALESCE(deleted_at, ?), sync_state = 'synced' WHERE id = ?", new Date().toISOString(), taskId);
}

export async function markTaskSynced(taskId: string) {
  const database = await getDatabase();
  await database.runAsync("UPDATE local_tasks SET pending_xp = NULL, pending_coins = NULL, sync_state = 'synced' WHERE id = ?", taskId);
}

/** Devolve o título para o aviso ao usuário. */
export async function restoreTaskCompletion(taskId: string) {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE local_tasks SET status = 'completed', completed_at = COALESCE(completed_at, ?), sync_state = 'synced' WHERE id = ?",
    new Date().toISOString(), taskId,
  );
  const row = await database.getFirstAsync<{ title: string }>('SELECT title FROM local_tasks WHERE id = ?', taskId);
  return row?.title;
}

/** Devolve o título para o aviso ao usuário. */
export async function revertTaskCompletion(taskId: string) {
  const database = await getDatabase();
  await database.runAsync("UPDATE local_tasks SET status = 'pending', completed_at = NULL, pending_xp = NULL, pending_coins = NULL, sync_state = 'synced' WHERE id = ?", taskId);
  const row = await database.getFirstAsync<{ title: string }>('SELECT title FROM local_tasks WHERE id = ?', taskId);
  return row?.title;
}

export async function markFocusSessionSynced(sessionId: string, synced: boolean) {
  const database = await getDatabase();
  await database.runAsync('UPDATE local_focus_sessions SET sync_state = ? WHERE id = ?', synced ? 'synced' : 'rejected', sessionId);
}

export async function pendingOperationCount() {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ total: number }>("SELECT count(*) AS total FROM sync_queue WHERE state = 'pending'");
  return row?.total ?? 0;
}

/** Há operação que já tentou ir ao servidor e falhou (sem conexão, servidor fora do ar). */
export async function hasFailedSendAttempt() {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ total: number }>("SELECT count(*) AS total FROM sync_queue WHERE state = 'pending' AND attempts > 0");
  return (row?.total ?? 0) > 0;
}
