import type { Recurrence } from './recurrence';

export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskStatus = 'pending' | 'completed';
export type TaskCategory = 'personal' | 'work' | 'study' | 'health' | 'career';
export type TaskKind = 'normal' | 'special';

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
  category?: TaskCategory | null;
  estimatedMinutes?: number | null;
  kind?: TaskKind | null;
  createdAt?: string | null;
};

export const difficultyLabel: Record<TaskDifficulty, string> = { easy: 'Fácil', medium: 'Média', hard: 'Difícil' };

export const estimatedReward: Record<TaskDifficulty, { xp: number; coins: number }> = {
  easy: { xp: 10, coins: 2 },
  medium: { xp: 20, coins: 3 },
  hard: { xp: 40, coins: 5 },
};

export const categoryLabel: Record<TaskCategory, string> = {
  personal: 'Pessoal',
  work: 'Trabalho',
  study: 'Estudo',
  health: 'Saúde',
  career: 'Carreira',
};

/** RN14: tarefas especiais por semana (segunda a domingo). Espelho do limite da API. */
export const SPECIAL_WEEKLY_LIMIT = 5;
export const ESTIMATE_MINUTES_RANGE = { min: 1, max: 600 };

/** Especiais não rendem XP nem moedas: valem uma reação rara do pato. */
export function rewardFor(task: Pick<Task, 'difficulty' | 'kind'>) {
  return task.kind === 'special' ? { xp: 0, coins: 0 } : estimatedReward[task.difficulty];
}

/** Estimativa digitada: vazio = sem estimativa (`null`); fora do intervalo = `undefined`. */
export function parseEstimate(text: string): number | null | undefined {
  const value = text.trim();
  if (!value) return null;
  if (!/^\d{1,3}$/.test(value)) return undefined;
  const minutes = Number(value);
  return minutes >= ESTIMATE_MINUTES_RANGE.min && minutes <= ESTIMATE_MINUTES_RANGE.max ? minutes : undefined;
}

export function formatEstimate(minutes: number) {
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `~${hours}h${String(rest).padStart(2, '0')}` : `~${hours}h`;
}

/** Segunda-feira 00:00 (hora local) da semana de `now`. */
export function weekStart(now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

/** Busca sem diferenciar maiúsculas nem acentos. */
export function normalizeSearch(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

export function matchesSearch(task: Pick<Task, 'title' | 'description'>, query: string) {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  return normalizeSearch(task.title).includes(needle) || normalizeSearch(task.description ?? '').includes(needle);
}

export type DueOption = 'none' | 'today' | 'tomorrow' | 'week';

/** Prazo no fim do dia escolhido (23:59, hora local). "Esta semana" vence no domingo. */
export function dueAtFor(option: DueOption, now = new Date()) {
  if (option === 'none') return null;
  const date = new Date(now);
  if (option === 'tomorrow') date.setDate(date.getDate() + 1);
  if (option === 'week') date.setDate(date.getDate() + ((7 - date.getDay()) % 7));
  date.setHours(23, 59, 0, 0);
  return date.toISOString();
}

export function isOverdue(task: Task, now = new Date()) {
  return task.status === 'pending' && !!task.dueAt && new Date(task.dueAt).getTime() < now.getTime();
}

export function isForToday(task: Task, now = new Date()) {
  if (!task.dueAt) return task.status === 'pending';
  const due = new Date(task.dueAt);
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
}

/** `protectedDates` (AAAA-MM-DD locais, do escudo da sequência) contam como dias com tarefa. */
export function currentStreak(completionDates: string[], now = new Date(), protectedDates: string[] = []): number {
  const days = new Set(completionDates.map((value) => new Date(value).toDateString()));
  for (const date of protectedDates) {
    const [year, month, day] = date.split('-').map(Number);
    days.add(new Date(year, month - 1, day).toDateString());
  }
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
