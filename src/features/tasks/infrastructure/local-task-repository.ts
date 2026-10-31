import { getDatabase } from '../../../db/client';
import { deterministicId, newId } from '../../../shared/utils/identifier';
import { discardPendingOperation, enqueueOperation, mergeIntoPendingTaskOperation } from '../../sync/infrastructure/sync-repository';
import { dayKey, nextOccurrence, type RecurrenceRule } from '../domain/recurrence';
import { isOverdue, rewardFor, weekStart, type Task, type TaskCategory, type TaskDifficulty, type TaskKind, type TaskStatus } from '../domain/task';

const selectColumns = `id, title, description, difficulty, status, due_at AS dueAt, completed_at AS completedAt,
  pending_xp AS pendingXp, pending_coins AS pendingCoins, recurrence, recurrence_day AS recurrenceDay, series_id AS seriesId,
  category, estimated_minutes AS estimatedMinutes, kind, created_at AS createdAt`;

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

type NewTask = {
  title: string;
  description?: string | null;
  difficulty: TaskDifficulty;
  dueAt?: string | null;
  rule?: RecurrenceRule | null;
  category?: TaskCategory | null;
  estimatedMinutes?: number | null;
  kind?: TaskKind;
};

async function insertLocalTask(id: string, input: NewTask, seriesId: string | null) {
  const database = await getDatabase();
  const rule = input.rule ?? null;
  const kind = input.kind ?? 'normal';
  const category = input.category ?? 'personal';
  const now = new Date().toISOString();
  const result = await database.runAsync(
    `INSERT OR IGNORE INTO local_tasks (id, title, description, difficulty, status, due_at, version, updated_at, created_at, recurrence, recurrence_day, series_id, category, estimated_minutes, kind, sync_state)
     VALUES (?, ?, ?, ?, 'pending', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    id, input.title, input.description ?? null, input.difficulty, input.dueAt ?? null, now, now, rule?.recurrence ?? null, rule?.recurrenceDay ?? null, seriesId, category, input.estimatedMinutes ?? null, kind,
  );
  if (!result.changes) return false;
  await enqueueOperation('task.create', {
    title: input.title, description: input.description ?? null, difficulty: input.difficulty, dueAt: input.dueAt ?? null,
    category, estimatedMinutes: input.estimatedMinutes ?? null, kind,
    ...(rule ? { recurrence: rule.recurrence, recurrenceDay: rule.recurrenceDay, seriesId } : {}),
  }, { resourceId: id });
  return true;
}

/** Especiais criadas nesta semana neste aparelho, inclusive as excluídas (excluir não devolve a cota). O servidor confirma. */
export async function countSpecialThisWeek(now = new Date()) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ total: number }>(
    "SELECT count(*) AS total FROM local_tasks WHERE kind = 'special' AND created_at >= ?", weekStart(now).toISOString(),
  );
  return row?.total ?? 0;
}

/** Tarefas já feitas para reaproveitar (HU11): as mais recentes, sem títulos repetidos. */
export async function listReusableTasks(limit = 6): Promise<Task[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Task>(
    `SELECT ${selectColumns} FROM local_tasks WHERE status = 'completed' AND kind = 'normal' ORDER BY completed_at DESC LIMIT 50`,
  );
  const seen = new Set<string>();
  return rows.filter((task) => {
    const key = task.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
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
    const task = { title: latest.title, description: latest.description, difficulty: latest.difficulty, dueAt: due.toISOString(), rule, category: latest.category, estimatedMinutes: latest.estimatedMinutes };
    if (await insertLocalTask(id, task, latest.seriesId!)) created += 1;
  }
  return created;
}

export type TaskChanges = {
  title?: string;
  description?: string | null;
  difficulty?: TaskDifficulty;
  dueAt?: string | null;
  category?: TaskCategory;
  estimatedMinutes?: number | null;
};

/**
 * Campos ausentes ficam como estão; `dueAt: null` tira o prazo.
 * Enquanto a criação ou uma edição anterior não sai da fila, a mudança entra nela em vez de virar outra operação.
 */
export async function updateLocalTask(task: Task, changes: TaskChanges) {
  const database = await getDatabase();
  const current = await database.getFirstAsync<{ version: number } & Required<Pick<Task, 'title' | 'difficulty'>> & Pick<Task, 'description' | 'dueAt' | 'category' | 'estimatedMinutes'>>(
    'SELECT version, title, description, difficulty, due_at AS dueAt, category, estimated_minutes AS estimatedMinutes FROM local_tasks WHERE id = ?', task.id,
  );
  if (!current) throw new Error('Tarefa local não encontrada.');
  const next = { ...current, ...changes };
  await database.runAsync(
    "UPDATE local_tasks SET title = ?, description = ?, difficulty = ?, due_at = ?, category = ?, estimated_minutes = ?, updated_at = ?, sync_state = 'pending' WHERE id = ?",
    next.title, next.description ?? null, next.difficulty, next.dueAt ?? null, next.category ?? 'personal', next.estimatedMinutes ?? null, new Date().toISOString(), task.id,
  );
  if (await mergeIntoPendingTaskOperation(task.id, changes)) return;
  // Versão 0 = criada aqui; se a criação já foi aceita, o servidor está na versão 1.
  await enqueueOperation('task.update', { ...changes }, { resourceId: task.id, baseVersion: Math.max(current.version, 1) });
}

export async function completeLocalTask(task: Task) {
  const database = await getDatabase();
  const completedAt = new Date().toISOString();
  const reward = rewardFor(task);
  await database.runAsync(
    "UPDATE local_tasks SET status = 'completed', completed_at = ?, updated_at = ?, sync_state = 'pending', pending_xp = ?, pending_coins = ? WHERE id = ? AND status = 'pending'",
    completedAt, completedAt, reward.xp, reward.coins, task.id,
  );
  await enqueueOperation('task.complete', { completedAt }, { resourceId: task.id });
  return reward;
}

async function markLocalPending(taskId: string, syncState: 'synced' | 'pending', version?: number) {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE local_tasks SET status = 'pending', completed_at = NULL, pending_xp = NULL, pending_coins = NULL, updated_at = ?, sync_state = ?, version = COALESCE(?, version) WHERE id = ?",
    new Date().toISOString(), syncState, version ?? null, taskId,
  );
}

/** Se a conclusão ainda está na fila, desmarcar só a cancela: nada chegou ao servidor. */
export async function cancelPendingCompletion(task: Task) {
  const cancelled = await discardPendingOperation('task.complete', task.id);
  if (cancelled) await markLocalPending(task.id, 'synced');
  return cancelled;
}

/** O servidor já desmarcou e estornou: a cópia local acompanha a versão dele. */
export async function applyServerReopen(taskId: string, version: number) {
  await markLocalPending(taskId, 'synced', version);
}

/** Sem conexão: desmarca no aparelho e deixa o estorno para a sincronização. */
export async function queueLocalReopen(task: Task) {
  await markLocalPending(task.id, 'pending');
  await enqueueOperation('task.reopen', {}, { resourceId: task.id });
}

export async function deleteLocalTask(task: Task) {
  const database = await getDatabase();
  const current = await database.getFirstAsync<{ version: number }>('SELECT version FROM local_tasks WHERE id = ?', task.id);
  if (!current) throw new Error('Tarefa local não encontrada.');
  await database.runAsync("UPDATE local_tasks SET deleted_at = ?, sync_state = 'pending' WHERE id = ?", new Date().toISOString(), task.id);
  await enqueueOperation('task.delete', {}, { resourceId: task.id, baseVersion: current.version });
}
