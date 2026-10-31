import { describe, expect, it } from '@jest/globals';
import { byCategory, completedByDay, monthHeatmap, monthSummary, petEvolution, radar, totals, weeklyTasks, xpByDay } from './aggregate';
import type { Task } from '../../tasks/domain/task';

const now = new Date(2026, 9, 30, 15); // sexta-feira
const at = (day: number) => new Date(2026, 9, day, 10).toISOString();
const done = (id: string, day: number, difficulty: Task['difficulty'], category: Task['category'] = 'study'): Task =>
  ({ id, title: id, difficulty, status: 'completed', completedAt: at(day), category });
const tasks: Task[] = [
  done('a', 26, 'easy'), done('b', 28, 'hard', 'work'), done('c', 30, 'medium'), done('d', 30, 'medium', 'health'), done('e', 5, 'easy'),
  { id: 'p', title: 'pendente', difficulty: 'hard', status: 'pending' },
];
const sessions = [{ finishedAt: at(29), durationSeconds: 1500 }, { finishedAt: at(30), durationSeconds: 3000 }];
const input = { tasks, sessions };

describe('relatórios (HU25, HU26, HU27)', () => {
  it('totais', () => {
    expect(totals(input, 250, now)).toEqual({ tasksCompleted: 5, focusMinutes: 75, streak: 1, xpTotal: 250, level: 2 });
  });

  it('produtividade semanal de segunda a domingo', () => {
    expect(weeklyTasks(tasks, now).map((day) => `${day.label}:${day.value}`)).toEqual(['Seg:1', 'Ter:0', 'Qua:1', 'Qui:0', 'Sex:2', 'Sáb:0', 'Dom:0']);
  });

  it('mapa do mês em semanas completas', () => {
    const weeks = monthHeatmap(tasks, 2026, 9);
    expect(weeks).toHaveLength(5);
    expect(weeks.flat().find((cell) => cell.inMonth && cell.date.getDate() === 30)?.count).toBe(2);
  });

  it('XP por dia soma tarefas e foco', () => {
    expect(xpByDay(input, now).map((day) => day.value)).toEqual([0, 0, 10, 0, 40, 20, 80]);
  });

  it('por categoria e resumo do mês', () => {
    expect(byCategory(tasks, new Date(2026, 9, 1), new Date(2026, 10, 1)).map((item) => item.value)).toEqual([0, 1, 3, 1, 0]);
    expect(monthSummary(input, 2026, 9)).toMatchObject({ tasksCompleted: 5, focusMinutes: 75, xp: 160, activeDays: 5 });
  });

  it('radar de 0 a 100, com o eixo social pelos amigos', () => {
    expect(radar(input, now, 2).map((axis) => `${axis.label}:${axis.value}`)).toEqual(['Tarefas:19', 'Hábitos:0', 'Foco:50', 'Social:40', 'XP:36']);
  });

  it('evolução do pet volta no tempo a partir do XP atual', () => {
    expect(petEvolution(input, 250, now, 7).map((point) => point.xp)).toEqual([100, 100, 110, 110, 150, 170, 250]);
  });

  it('histórico agrupado por dia, do mais recente', () => {
    expect(completedByDay(tasks, 30, now).map((group) => `${group.date.getDate()}:${group.tasks.length}`)).toEqual(['30:2', '28:1', '26:1', '5:1']);
  });
});
