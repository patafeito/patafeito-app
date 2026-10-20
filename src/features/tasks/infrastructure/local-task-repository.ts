import { getDatabase } from '../../../db/client';
import type { Task, TaskDifficulty } from '../domain/task';
import { enqueueOperation } from '../../sync/infrastructure/sync-repository';

export async function listLocalTasks(): Promise<Task[]> {
  const database = await getDatabase();
  return database.getAllAsync<Task>('SELECT id, title, difficulty, status, due_at AS dueAt FROM local_tasks WHERE deleted_at IS NULL ORDER BY updated_at DESC');
}

export async function createLocalTask(input: { title: string; description?: string; difficulty: TaskDifficulty; dueAt?: string }) {
  const database = await getDatabase();
  const id = crypto.randomUUID();
  const updatedAt = new Date().toISOString();
  await database.runAsync("INSERT INTO local_tasks (id, title, description, difficulty, status, due_at, version, updated_at, sync_state) VALUES (?, ?, ?, ?, 'pending', ?, 0, ?, 'pending')", id, input.title, input.description ?? null, input.difficulty, input.dueAt ?? null, updatedAt);
  await enqueueOperation('task.create', { title: input.title, description: input.description ?? null, difficulty: input.difficulty, dueAt: input.dueAt ?? null }, { resourceId: id });
  return id;
}

export async function updateLocalTask(task: Task, changes: { title?: string; difficulty?: TaskDifficulty; dueAt?: string | null }) {
  const database = await getDatabase();
  const current = await database.getFirstAsync<{ version: number }>('SELECT version FROM local_tasks WHERE id = ?', task.id);
  if (!current) throw new Error('Tarefa local não encontrada.');
  const payload = { ...changes };
  await database.runAsync("UPDATE local_tasks SET title = COALESCE(?, title), difficulty = COALESCE(?, difficulty), due_at = COALESCE(?, due_at), updated_at = ?, sync_state = 'pending' WHERE id = ?", changes.title ?? null, changes.difficulty ?? null, changes.dueAt ?? null, new Date().toISOString(), task.id);
  await enqueueOperation('task.update', payload, { resourceId: task.id, baseVersion: current.version });
}

export async function deleteLocalTask(task: Task) {
  const database = await getDatabase();
  const current = await database.getFirstAsync<{ version: number }>('SELECT version FROM local_tasks WHERE id = ?', task.id);
  if (!current) throw new Error('Tarefa local não encontrada.');
  await database.runAsync("UPDATE local_tasks SET deleted_at = ?, sync_state = 'pending' WHERE id = ?", new Date().toISOString(), task.id);
  await enqueueOperation('task.delete', {}, { resourceId: task.id, baseVersion: current.version });
}
