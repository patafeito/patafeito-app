export const POMODORO_DURATION_SECONDS = 25 * 60;
export const POMODORO_BREAK_SECONDS = 5 * 60;

export type FocusSessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type FocusSession = {
  id: string;
  taskId?: string | null;
  startedAt: string;
  durationSeconds: number;
  status: FocusSessionStatus;
  finishedAt?: string | null;
  pausedAt?: string | null;
};

export function remainingSeconds(session: FocusSession, now = Date.now()): number {
  const reference = session.status === 'paused' && session.pausedAt ? new Date(session.pausedAt).getTime() : now;
  const elapsed = reference - new Date(session.startedAt).getTime();
  return Math.max(0, Math.ceil(session.durationSeconds - elapsed / 1000));
}

export function isComplete(session: FocusSession, now = Date.now()) {
  return remainingSeconds(session, now) === 0;
}

export function formatRemaining(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
