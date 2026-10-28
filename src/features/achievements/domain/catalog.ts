import type { ComponentProps } from 'react';
import type { Ionicons } from '@react-native-vector-icons/ionicons';

/**
 * Conquistas calculadas no aparelho a partir do que já é registrado (tarefas, ciclos, sequência, nível, itens).
 * Não há estado próprio no servidor: desbloquear é só cruzar a meta.
 */
export type AchievementMetrics = {
  completedTasks: number;
  focusSessions: number;
  bestStreak: number;
  level: number;
  itemsOwned: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  metric: keyof AchievementMetrics;
  goal: number;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const achievements: Achievement[] = [
  { id: 'first-task', title: 'Primeiro passo', description: 'Conclua sua primeira tarefa.', metric: 'completedTasks', goal: 1, icon: 'footsteps' },
  { id: 'tasks-10', title: 'Dez vitórias', description: 'Conclua 10 tarefas.', metric: 'completedTasks', goal: 10, icon: 'checkmark-done' },
  { id: 'tasks-50', title: 'Lago cheio', description: 'Conclua 50 tarefas.', metric: 'completedTasks', goal: 50, icon: 'water' },
  { id: 'focus-1', title: 'Primeiro mergulho', description: 'Feche um ciclo de foco.', metric: 'focusSessions', goal: 1, icon: 'timer' },
  { id: 'focus-10', title: 'Maré calma', description: 'Feche 10 ciclos de foco.', metric: 'focusSessions', goal: 10, icon: 'headset' },
  { id: 'focus-50', title: 'Mestre do foco', description: 'Feche 50 ciclos de foco.', metric: 'focusSessions', goal: 50, icon: 'hourglass' },
  { id: 'streak-3', title: 'Três dias seguidos', description: 'Mantenha uma sequência de 3 dias.', metric: 'bestStreak', goal: 3, icon: 'flame' },
  { id: 'streak-7', title: 'Semana redonda', description: 'Mantenha uma sequência de 7 dias.', metric: 'bestStreak', goal: 7, icon: 'calendar' },
  { id: 'streak-30', title: 'Rotina de Bento', description: 'Mantenha uma sequência de 30 dias.', metric: 'bestStreak', goal: 30, icon: 'ribbon' },
  { id: 'level-5', title: 'Pato crescido', description: 'Chegue ao nível 5.', metric: 'level', goal: 5, icon: 'star' },
  { id: 'level-10', title: 'Pato veterano', description: 'Chegue ao nível 10.', metric: 'level', goal: 10, icon: 'trophy' },
  { id: 'first-item', title: 'Primeira compra', description: 'Compre um item na loja.', metric: 'itemsOwned', goal: 1, icon: 'bag-handle' },
];

export type AchievementProgress = Achievement & { current: number; unlocked: boolean };

export function evaluateAchievements(metrics: AchievementMetrics): AchievementProgress[] {
  return achievements.map((achievement) => {
    const current = Math.min(metrics[achievement.metric], achievement.goal);
    return { ...achievement, current, unlocked: current >= achievement.goal };
  });
}

/** A conquista bloqueada mais perto de sair: a que mais motiva mostrar. */
export function nextAchievement(progress: AchievementProgress[]) {
  return progress.filter((item) => !item.unlocked).sort((a, b) => b.current / b.goal - a.current / a.goal)[0];
}

/** Maior sequência de dias com conclusão (ou dia protegido) em todo o histórico. */
export function longestStreak(completionDates: string[], protectedDates: string[] = []) {
  const days = new Set(completionDates.map((value) => new Date(value).toDateString()));
  for (const date of protectedDates) {
    const [year, month, day] = date.split('-').map(Number);
    days.add(new Date(year, month - 1, day).toDateString());
  }
  let best = 0;
  for (const value of days) {
    const previous = new Date(value);
    previous.setDate(previous.getDate() - 1);
    if (days.has(previous.toDateString())) continue;
    let length = 0;
    const cursor = new Date(value);
    while (days.has(cursor.toDateString())) {
      length += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    best = Math.max(best, length);
  }
  return best;
}
