import { getDatabase } from '../../../db/client';
import { newId } from '../../../shared/utils/identifier';
import { enqueueOperation } from '../../sync/infrastructure/sync-repository';
import { focusRewards, isComplete, POMODORO_DURATION_SECONDS, type FocusPresetId, type FocusSession } from '../domain/focus-session';

const selectColumns = `id, task_id AS taskId, started_at AS startedAt, duration_seconds AS durationSeconds,
  status, finished_at AS finishedAt, paused_at AS pausedAt, mode`;

export async function activeSession(): Promise<FocusSession | undefined> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<FocusSession>(`SELECT ${selectColumns} FROM local_focus_sessions WHERE status IN ('active', 'paused') ORDER BY started_at DESC LIMIT 1`);
  return row ?? undefined;
}

export async function startSession(taskId?: string | null, durationSeconds = POMODORO_DURATION_SECONDS, mode: FocusPresetId = 'pomodoro'): Promise<FocusSession> {
  const database = await getDatabase();
  const session: FocusSession = {
    id: newId(),
    taskId: taskId ?? null,
    startedAt: new Date().toISOString(),
    durationSeconds,
    status: 'active',
    mode,
  };
  await database.runAsync(
    "INSERT INTO local_focus_sessions (id, task_id, started_at, duration_seconds, status, mode, sync_state) VALUES (?, ?, ?, ?, 'active', ?, 'local')",
    session.id, session.taskId ?? null, session.startedAt, session.durationSeconds, mode,
  );
  return session;
}

export async function pauseSession(session: FocusSession): Promise<FocusSession> {
  const database = await getDatabase();
  const pausedAt = new Date().toISOString();
  await database.runAsync("UPDATE local_focus_sessions SET status = 'paused', paused_at = ? WHERE id = ?", pausedAt, session.id);
  return { ...session, status: 'paused', pausedAt };
}

export async function resumeSession(session: FocusSession): Promise<FocusSession> {
  const database = await getDatabase();
  const pausedFor = session.pausedAt ? Date.now() - new Date(session.pausedAt).getTime() : 0;
  const startedAt = new Date(new Date(session.startedAt).getTime() + pausedFor).toISOString();
  await database.runAsync("UPDATE local_focus_sessions SET status = 'active', paused_at = NULL, started_at = ? WHERE id = ?", startedAt, session.id);
  return { ...session, status: 'active', pausedAt: null, startedAt };
}

export async function cancelSession(session: FocusSession) {
  const database = await getDatabase();
  await database.runAsync("UPDATE local_focus_sessions SET status = 'cancelled', finished_at = ? WHERE id = ?", new Date().toISOString(), session.id);
}

export async function completeSession(session: FocusSession) {
  if (!isComplete(session)) throw new Error('O ciclo de foco ainda não terminou.');
  const database = await getDatabase();
  const finishedAt = new Date().toISOString();
  await database.runAsync("UPDATE local_focus_sessions SET status = 'completed', finished_at = ?, sync_state = 'pending' WHERE id = ?", finishedAt, session.id);
  await enqueueOperation('focus.complete', {
    startedAt: session.startedAt, finishedAt, durationSeconds: session.durationSeconds, mode: session.mode ?? 'pomodoro', taskId: session.taskId ?? null,
  }, { resourceId: session.id });
}

/** Ciclos concluídos hoje (desde a meia-noite local) e o XP estimado deles, sem bônus de poderes. */
export async function todayFocusStats(now = new Date()) {
  const database = await getDatabase();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const rows = await database.getAllAsync<{ durationSeconds: number }>(
    "SELECT duration_seconds AS durationSeconds FROM local_focus_sessions WHERE status = 'completed' AND finished_at >= ?", midnight.toISOString(),
  );
  return { sessions: rows.length, xp: rows.reduce((total, row) => total + focusRewards(row.durationSeconds).xp, 0) };
}

export async function countCompletedSessions() {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ total: number }>("SELECT count(*) AS total FROM local_focus_sessions WHERE status = 'completed'");
  return row?.total ?? 0;
}

/** Ciclos concluídos para o histórico e os relatórios. */
export async function listCompletedSessions(): Promise<{ finishedAt: string; durationSeconds: number }[]> {
  const database = await getDatabase();
  return database.getAllAsync<{ finishedAt: string; durationSeconds: number }>(
    "SELECT finished_at AS finishedAt, duration_seconds AS durationSeconds FROM local_focus_sessions WHERE status = 'completed' AND finished_at IS NOT NULL",
  );
}
