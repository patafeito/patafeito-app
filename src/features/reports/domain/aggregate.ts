import { focusRewards } from '../../focus/domain/focus-session';
import { buildHabits } from '../../habits/domain/habit';
import { DEFAULT_DAILY_GOAL_XP } from '../../pet/domain/emotion';
import { levelForXp } from '../../pet/domain/progression';
import { categoryLabel, currentStreak, rewardFor, weekStart, type Task, type TaskCategory } from '../../tasks/domain/task';

/**
 * Indicadores do histórico e dos relatórios (HU25, HU26, HU27; Telas 11 e 12), calculados no
 * aparelho a partir do SQLite: funcionam offline. O XP é estimado pela tabela de recompensas,
 * sem os bônus de poderes e de sequência, que só o servidor conhece.
 */

export type FocusRecord = { finishedAt: string; durationSeconds: number };
export type ReportInput = { tasks: Task[]; sessions: FocusRecord[]; protectedDates?: string[] };
export type DayValue = { date: Date; label: string; value: number };

const weekdayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
/** Meta semanal de tarefas para o eixo "Tarefas": 3 por dia. */
const WEEKLY_TASK_GOAL = 21;
/** Meta semanal de foco para o eixo "Foco": 150 minutos (6 Pomodoros). */
const WEEKLY_FOCUS_MINUTES = 150;
/** Cada amigo vale 20 pontos no eixo "Social" (5 amigos = 100). */
const SOCIAL_POINTS_PER_FRIEND = 20;

const dayKey = (date: Date) => date.toDateString();

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function completedTasks(tasks: Task[]) {
  return tasks.filter((task): task is Task & { completedAt: string } => task.status === 'completed' && !!task.completedAt);
}

function inRange(iso: string, start: Date, end: Date) {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time < end.getTime();
}

/** XP estimado por dia: tarefas (pela dificuldade) e ciclos de foco (pela duração). */
function xpByDayMap({ tasks, sessions }: ReportInput) {
  const totals = new Map<string, number>();
  const add = (iso: string, xp: number) => totals.set(dayKey(new Date(iso)), (totals.get(dayKey(new Date(iso))) ?? 0) + xp);
  for (const task of completedTasks(tasks)) add(task.completedAt, rewardFor(task).xp);
  for (const session of sessions) add(session.finishedAt, focusRewards(session.durationSeconds).xp);
  return totals;
}

export function totals(input: ReportInput, xpTotal: number, now = new Date()) {
  const done = completedTasks(input.tasks);
  return {
    tasksCompleted: done.length,
    focusMinutes: Math.round(input.sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60),
    streak: currentStreak(done.map((task) => task.completedAt), now, input.protectedDates ?? []),
    xpTotal,
    level: levelForXp(xpTotal),
  };
}

/** Produtividade semanal (Tela 11): tarefas concluídas de segunda a domingo da semana atual. */
export function weeklyTasks(tasks: Task[], now = new Date()): DayValue[] {
  const monday = weekStart(now);
  const counts = new Map<string, number>();
  for (const task of completedTasks(tasks)) counts.set(dayKey(new Date(task.completedAt)), (counts.get(dayKey(new Date(task.completedAt))) ?? 0) + 1);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    return { date, label: weekdayShort[date.getDay()], value: counts.get(dayKey(date)) ?? 0 };
  });
}

export type HeatmapCell = { date: Date; count: number; inMonth: boolean };

/** Atividade do mês (Tela 11): semanas de segunda a domingo, com as tarefas concluídas por dia. */
export function monthHeatmap(tasks: Task[], year: number, month: number): HeatmapCell[][] {
  const counts = new Map<string, number>();
  for (const task of completedTasks(tasks)) counts.set(dayKey(new Date(task.completedAt)), (counts.get(dayKey(new Date(task.completedAt))) ?? 0) + 1);
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const weeks: HeatmapCell[][] = [];
  for (let cursor = weekStart(first); cursor <= last; cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => {
      const date = addDays(cursor, index);
      return { date, count: counts.get(dayKey(date)) ?? 0, inMonth: date.getMonth() === month };
    }));
  }
  return weeks;
}

/** Evolução de XP (Tela 12): XP estimado de cada um dos últimos `days` dias, terminando hoje. */
export function xpByDay(input: ReportInput, now = new Date(), days = 7): DayValue[] {
  const totalsByDay = xpByDayMap(input);
  const today = startOfDay(now);
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index - days + 1);
    return { date, label: days <= 7 ? weekdayShort[date.getDay()] : String(date.getDate()), value: totalsByDay.get(dayKey(date)) ?? 0 };
  });
}

/** Por categoria (Tela 12): tarefas concluídas no período, por área da vida. */
export function byCategory(tasks: Task[], start: Date, end: Date) {
  const counts = new Map<TaskCategory, number>();
  for (const task of completedTasks(tasks)) {
    if (!inRange(task.completedAt, start, end)) continue;
    const category = task.category ?? 'personal';
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return (Object.keys(categoryLabel) as TaskCategory[]).map((category) => ({ category, label: categoryLabel[category], value: counts.get(category) ?? 0 }));
}

export type RadarAxis = { label: string; value: number };

/** Desempenho geral (Tela 12): cinco eixos de 0 a 100, sobre a semana atual. */
export function radar(input: ReportInput, now = new Date(), friends = 0): RadarAxis[] {
  const monday = weekStart(now);
  const nextMonday = addDays(monday, 7);
  const weekTasks = completedTasks(input.tasks).filter((task) => inRange(task.completedAt, monday, nextMonday));
  const weekSessions = input.sessions.filter((session) => inRange(session.finishedAt, monday, nextMonday));
  const focusMinutes = weekSessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60;
  const habits = buildHabits(input.tasks, now);
  const habitRate = habits.length ? habits.reduce((sum, habit) => sum + habit.rate, 0) / habits.length : 0;
  const weekXp = weekTasks.reduce((sum, task) => sum + rewardFor(task).xp, 0) + weekSessions.reduce((sum, session) => sum + focusRewards(session.durationSeconds).xp, 0);
  const cap = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
  return [
    { label: 'Tarefas', value: cap((weekTasks.length / WEEKLY_TASK_GOAL) * 100) },
    { label: 'Hábitos', value: cap(habitRate * 100) },
    { label: 'Foco', value: cap((focusMinutes / WEEKLY_FOCUS_MINUTES) * 100) },
    { label: 'Social', value: cap(friends * SOCIAL_POINTS_PER_FRIEND) },
    { label: 'XP', value: cap((weekXp / (7 * DEFAULT_DAILY_GOAL_XP)) * 100) },
  ];
}

/** Relatório mensal (HU26): números do mês escolhido. */
export function monthSummary(input: ReportInput, year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const tasks = completedTasks(input.tasks).filter((task) => inRange(task.completedAt, start, end));
  const sessions = input.sessions.filter((session) => inRange(session.finishedAt, start, end));
  const daily = xpByDayMap({ tasks, sessions });
  let bestDay: { date: Date; xp: number } | undefined;
  for (const [key, xp] of daily) if (!bestDay || xp > bestDay.xp) bestDay = { date: new Date(key), xp };
  return {
    tasksCompleted: tasks.length,
    focusMinutes: Math.round(sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60),
    xp: [...daily.values()].reduce((sum, xp) => sum + xp, 0),
    activeDays: daily.size,
    bestDay,
  };
}

/**
 * Evolução do pet (HU27): XP acumulado e nível ao fim de cada dia dos últimos `days` dias.
 * Parte do XP atual e desconta, de trás para frente, o que foi ganho em cada dia.
 */
export function petEvolution(input: ReportInput, xpTotal: number, now = new Date(), days = 30) {
  const daily = xpByDay(input, now, days);
  let xpAtEnd = xpTotal;
  const points = [...daily].reverse().map((day) => {
    const point = { date: day.date, label: day.label, xp: Math.max(0, xpAtEnd), level: levelForXp(Math.max(0, xpAtEnd)) };
    xpAtEnd -= day.value;
    return point;
  });
  return points.reverse();
}

/** Histórico (HU25): tarefas concluídas agrupadas por dia, da mais recente para a mais antiga. */
export function completedByDay(tasks: Task[], limitDays = 30, now = new Date()) {
  const since = addDays(startOfDay(now), -limitDays + 1);
  const groups = new Map<string, { date: Date; tasks: Task[] }>();
  const done = completedTasks(tasks)
    .filter((task) => new Date(task.completedAt) >= since)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  for (const task of done) {
    const date = startOfDay(new Date(task.completedAt));
    const group = groups.get(dayKey(date)) ?? { date, tasks: [] };
    group.tasks.push(task);
    groups.set(dayKey(date), group);
  }
  return [...groups.values()];
}
