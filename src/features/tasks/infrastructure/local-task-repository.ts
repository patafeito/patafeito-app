import { getDatabase } from '../../../db/client';
import { deterministicId, newId } from '../../../shared/utils/identifier';
import { discardPendingOperation, enqueueOperation } from '../../sync/infrastructure/sync-repository';
import { dayKey, nextOccurrence, type RecurrenceRule } from '../domain/recurrence';
import { estimatedReward, isOverdue, type Task, type TaskDifficulty, type TaskStatus } from '../domain/task';

const selectColumns = `id, title, description, difficulty, status, due_at AS dueAt, completed_at AS completedAt,
  pending_xp AS pendingXp, pending_coins AS pendingCoins, recurrence, recurrence_day AS recurrenceDay, series_id AS seriesId`;

export async function listLocalTasks(filter: 'all' | TaskStatus = 'all'): Promise<Task[]> {
  const database = await getDatabase();
  const where = filter === 'all' ? '' : ' AND status = ?';
  const parameters = filter === 'all' ? [] : [filter];
  return database.getAllAsync<Task>(
    `SELECT ${selectColumns} FROM local_tasks WHERE deleted_at IS NULL${where} ORDER BY status = 'completed', due_at IS NULL, due_at, updated_at DESC`,
    ...parameters,
  );
}

export async function listCompletionDates(): Promise<string[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ completedAt: string }>("SELECT completed_at AS completedAt FROM local_tasks WHERE completed_at IS NOT NULL AND deleted_at IS NULL");
  return rows.map((row) => row.completedAt);
}

export async function countCompletedTasks() {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ total: number }>("SELECT count(*) AS total FROM local_tasks WHERE status = 'completed' AND deleted_at IS NULL");
  return row?.total ?? 0;
}

type NewTask = { title: string; description?: string | null; difficulty: TaskDifficulty; dueAt?: string | null; rule?: RecurrenceRule | null };

async function insertLocalTask(id: string, input: NewTask, seriesId: string | null) {
  const database = await getDatabase();
  const rule = input.rule ?? null;
  const result = await database.runAsync(
    "INSERT OR IGNORE INTO local_tasks (id, title, description, difficulty, status, due_at, version, updated_at, recurrence, recurrence_day, series_id, sync_state) VALUES (?, ?, ?, ?, 'pending', ?, 0, ?, ?, ?, ?, 'pending')",
    id, input.title, input.description ?? null, input.difficulty, input.dueAt ?? null, new Date().toISOString(), rule?.recurrence ?? null, rule?.recurrenceDay ?? null, seriesId,
  );
  if (!result.changes) return false;
  await enqueueOperation('task.create', {
    title: input.title, description: input.description ?? null, difficulty: input.difficulty, dueAt: input.dueAt ?? null,
    ...(rule ? { recurrence: rule.recurrence, recurrenceDay: rule.recurrenceDay, seriesId } : {}),
  }, { resourceId: id });
  return true;
}

/** Tarefas repetidas ganham o prazo da primeira data da série a partir de hoje. */
export async function createLocalTask(input: NewTask) {
  const id = newId();
  const dueAt = input.rule ? nextOccurrence(input.rule, null, new Date()).toISOString() : input.dueAt;
  await insertLocalTask(id, { ...input, dueAt }, input.rule ? id : null);
  return id;
}

type SeriesRow = Task & { deletedAt: string | null };

/**
 * Cria a próxima repetição de cada série cuja última tarefa já foi concluída ou venceu.
 * Uma série termina quando a última repetição é excluída. Devolve quantas tarefas foram criadas.
 */
export async function ensureRecurringOccurrences(now = new Date()) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SeriesRow>(
    `SELECT ${selectColumns}, deleted_at AS deletedAt FROM local_tasks WHERE series_id IS NOT NULL AND recurrence IS NOT NULL ORDER BY due_at DESC`,
  );
  const latestBySeries = new Map<string, SeriesRow>();
  for (const row of rows) if (!latestBySeries.has(row.seriesId!)) latestBySeries.set(row.seriesId!, row);

  let created = 0;
  for (const latest of latestBySeries.values()) {
    if (latest.deletedAt || (latest.status === 'pending' && !isOverdue(latest, now))) continue;
    const rule: RecurrenceRule = { recurrence: latest.recurrence!, recurrenceDay: latest.recurrenceDay ?? null };
    const due = nextOccurrence(rule, latest.dueAt ? new Date(latest.dueAt) : null, now);
    const id = await deterministicId(`${latest.seriesId}:${dayKey(due)}`);
    const task = { title: latest.title, description: latest.description, difficulty: latest.difficulty, dueAt: due.toISOString(), rule };
    if (await insertLocalTask(id, task, latest.seriesId!)) created += 1;
  }
  return created;
}

export async function updateLocalTask(task: Task, changes: { title?: string; difficulty?: TaskDifficulty; dueAt?: string | null }) {
  const database = await getDatabase();
  const current = await database.getFirstAsync<{ version: number }>('SELECT version FROM local_tasks WHERE id = ?', task.id);
  if (!current) throw new Error('Tarefa local não encontrada.');
  await database.runAsync(
    "UPDATE local_tasks SET title = COALESCE(?, title), difficulty = COALESCE(?, difficulty), due_at = COALESCE(?, due_at), updated_at = ?, sync_state = 'pending' WHERE id = ?",
    changes.title ?? null, changes.difficulty ?? null, changes.dueAt ?? null, new Date().toISOString(), task.id,
  );
  await enqueueOperation('task.update', { ...changes }, { resourceId: task.id, baseVersion: current.version });
}

export async function completeLocalTask(task: Task) {
  const database = await getDatabase();
  const completedAt = new Date().toISOString();
  const reward = estimatedReward[task.difficulty];
  await database.runAsync(
    "UPDATE local_tasks SET status = 'completed', completed_at = ?, updated_at = ?, sync_state = 'pending', pending_xp = ?, pending_coins = ? WHERE id = ? AND status = 'pending'",
    completedAt, completedAt, reward.xp, reward.coins, task.id,
  );
  await enqueueOperation('task.complete', { completedAt }, { resourceId: task.id });
  return reward;
}

export async function reopenLocalTask(task: Task) {
  const database = await getDatabase();
  const cancelled = await discardPendingOperation('task.complete', task.id);
  await database.runAsync(
    "UPDATE local_tasks SET status = 'pending', completed_at = NULL, pending_xp = NULL, pending_coins = NULL, updated_at = ?, sync_state = ? WHERE id = ?",
    new Date().toISOString(), cancelled ? 'synced' : 'pending', task.id,
  );
  if (!cancelled) await enqueueOperation('task.reopen', {}, { resourceId: task.id });
  return { cancelled };
}

export async function deleteLocalTask(task: Task) {
  const database = await getDatabase();
  const current = await database.getFirstAsync<{ version: number }>('SELECT version FROM local_tasks WHERE id = ?', task.id);
  if (!current) throw new Error('Tarefa local não encontrada.');
  await database.runAsync("UPDATE local_tasks SET deleted_at = ?, sync_state = 'pending' WHERE id = ?", new Date().toISOString(), task.id);
  await enqueueOperation('task.delete', {}, { resourceId: task.id, baseVersion: current.version });
}
