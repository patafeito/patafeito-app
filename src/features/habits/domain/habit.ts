import { recurrenceLabel, occursOn, type RecurrenceRule } from '../../tasks/domain/recurrence';
import type { Task, TaskDifficulty } from '../../tasks/domain/task';

/**
 * Hábito = série de tarefas recorrentes (mesmo `seriesId`). Cada repetição é uma tarefa;
 * o hábito junta as conclusões da série para mostrar frequência e sequência.
 */
export type Habit = {
  seriesId: string;
  title: string;
  difficulty: TaskDifficulty;
  rule: RecurrenceRule;
  label: string;
  /** Repetição de hoje, se existir e estiver pendente (é ela que o usuário marca). */
  today?: Task;
  doneToday: boolean;
  /** Últimos 7 dias, do mais antigo para hoje. */
  week: { date: Date; scheduled: boolean; done: boolean }[];
  /** Repetições seguidas cumpridas, contando para trás a partir da última que já devia ter acontecido. */
  streak: number;
  /** Cumpridas / previstas nos últimos 30 dias. */
  rate: number;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function buildHabits(tasks: Task[], now = new Date()): Habit[] {
  const series = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.seriesId || !task.recurrence) continue;
    series.set(task.seriesId, [...(series.get(task.seriesId) ?? []), task]);
  }

  const today = startOfDay(now);
  // Série ativa sempre tem uma repetição pendente (a próxima); sem ela, o hábito foi excluído.
  return [...series.entries()].filter(([, items]) => items.some((task) => task.status === 'pending')).map(([seriesId, items]) => {
    // A repetição mais nova dá o título e a regra atuais (edições valem daqui pra frente).
    const latest = [...items].sort((a, b) => (b.dueAt ?? '').localeCompare(a.dueAt ?? ''))[0];
    const rule: RecurrenceRule = { recurrence: latest.recurrence!, recurrenceDay: latest.recurrenceDay ?? null };
    const doneDays = new Set(items.filter((task) => task.completedAt).map((task) => new Date(task.completedAt!).toDateString()));
    const todayTask = items.find((task) => task.dueAt && new Date(task.dueAt).toDateString() === today.toDateString());

    const week = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return { date, scheduled: occursOn(rule, date), done: doneDays.has(date.toDateString()) };
    });

    let streak = 0;
    const cursor = new Date(today);
    // Hoje ainda não feito não quebra a sequência: o dia não acabou.
    if (!doneDays.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    for (let guard = 0; guard < 400; guard += 1) {
      if (occursOn(rule, cursor)) {
        if (!doneDays.has(cursor.toDateString())) break;
        streak += 1;
      }
      cursor.setDate(cursor.getDate() - 1);
    }

    let planned = 0;
    let done = 0;
    for (let offset = 0; offset < 30; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      if (!occursOn(rule, date)) continue;
      planned += 1;
      if (doneDays.has(date.toDateString())) done += 1;
    }

    return {
      seriesId,
      title: latest.title,
      difficulty: latest.difficulty,
      rule,
      label: recurrenceLabel(rule),
      today: todayTask?.status === 'pending' ? todayTask : undefined,
      doneToday: doneDays.has(today.toDateString()),
      week,
      streak,
      rate: planned ? done / planned : 0,
    };
  }).sort((a, b) => Number(!!b.today) - Number(!!a.today) || a.title.localeCompare(b.title));
}
