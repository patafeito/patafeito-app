import type { Recurrence } from './recurrence';

export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskStatus = 'pending' | 'completed';

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  dueAt?: string | null;
  completedAt?: string | null;
  pendingXp?: number | null;
  pendingCoins?: number | null;
  recurrence?: Recurrence | null;
  recurrenceDay?: number | null;
  seriesId?: string | null;
};

export const difficultyLabel: Record<TaskDifficulty, string> = { easy: 'Fácil', medium: 'Média', hard: 'Difícil' };

export const estimatedReward: Record<TaskDifficulty, { xp: number; coins: number }> = {
  easy: { xp: 10, coins: 1 },
  medium: { xp: 20, coins: 2 },
  hard: { xp: 40, coins: 3 },
};

export function isOverdue(task: Task, now = new Date()) {
  return task.status === 'pending' && !!task.dueAt && new Date(task.dueAt).getTime() < now.getTime();
}

export function isForToday(task: Task, now = new Date()) {
  if (!task.dueAt) return task.status === 'pending';
  const due = new Date(task.dueAt);
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
}

export function currentStreak(completionDates: string[], now = new Date()): number {
  const days = new Set(completionDates.map((value) => new Date(value).toDateString()));
  if (!days.size) return 0;
  const cursor = new Date(now);
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toDateString())) return 0;
  }
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
