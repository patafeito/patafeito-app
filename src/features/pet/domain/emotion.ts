import type { Task } from '../../tasks/domain/task';
import { rewardFor } from '../../tasks/domain/task';
import type { Pet } from './pet';
import type { PetStats } from './stats';

/** Espelho de `patafeito-api/src/modules/pets/domain/mood.ts`: mantenha as regras e constantes iguais. */
export type Emotion = 'happy' | 'neutral' | 'sad' | 'down';

export const emotionLabel: Record<Emotion, string> = { happy: 'Feliz', neutral: 'Neutro', sad: 'Triste', down: 'Abatido' };

export const OVERDUE_SAD_STREAK = 3;
export const INACTIVITY_HOURS = 24;
export const DEFAULT_DAILY_GOAL_XP = 60;
const SAD_HAPPINESS = 30;
const HAPPY_HAPPINESS = 70;
const DOWN_STAT = 15;

export type DailyGoal = { targetXp: number; earnedXp: number };

/** XP de tarefas concluídas hoje (hora local), pela tabela de dificuldade. O servidor confirma com os bônus. */
export function xpEarnedToday(tasks: Pick<Task, 'status' | 'completedAt' | 'difficulty' | 'kind'>[], now = new Date()) {
  const today = now.toDateString();
  return tasks
    .filter((task) => task.status === 'completed' && task.completedAt && new Date(task.completedAt).toDateString() === today)
    .reduce((total, task) => total + rewardFor(task).xp, 0);
}

/** Horas desde a última tarefa ou foco concluído; sem registro, desde a criação do pet. */
export function hoursSinceActivity(pet: Pick<Pet, 'lastActivityAt' | 'createdAt'>, now = new Date()) {
  const reference = pet.lastActivityAt ?? pet.createdAt;
  return reference ? (now.getTime() - new Date(reference).getTime()) / 3_600_000 : 0;
}

/**
 * Humor do pato. Prioridade: abatido > triste > feliz > neutro.
 * Fora do ar, a sequência de vencidas é a última que o servidor mandou.
 */
export function emotionFor(pet: Pick<Pet, 'overdueStreak' | 'lastActivityAt' | 'createdAt'>, stats: PetStats, goal: DailyGoal, now = new Date()): Emotion {
  if (Math.min(stats.hunger, stats.energy, stats.happiness) < DOWN_STAT) return 'down';
  if ((pet.overdueStreak ?? 0) >= OVERDUE_SAD_STREAK || hoursSinceActivity(pet, now) > INACTIVITY_HOURS || stats.happiness < SAD_HAPPINESS) return 'sad';
  if (goal.earnedXp >= goal.targetXp && stats.happiness >= HAPPY_HAPPINESS) return 'happy';
  return 'neutral';
}

/** Por que o pato está assim, para a pessoa saber o que fazer. */
export function emotionReason(emotion: Emotion, pet: Pick<Pet, 'overdueStreak' | 'lastActivityAt' | 'createdAt'>, stats: PetStats, goal: DailyGoal, now = new Date()) {
  if (emotion === 'down') return 'Algum cuidado está em falta. Veja as barras e cuide dele.';
  if (emotion === 'sad') {
    if ((pet.overdueStreak ?? 0) >= OVERDUE_SAD_STREAK) return `${pet.overdueStreak} tarefas venceram seguidas. Reagende ou conclua uma no prazo.`;
    if (hoursSinceActivity(pet, now) > INACTIVITY_HOURS) return 'Mais de um dia sem tarefas nem foco. Uma tarefa pequena já ajuda.';
    return 'A felicidade está baixa. Brincar ou mimar ajuda.';
  }
  if (emotion === 'happy') return 'Meta do dia cumprida!';
  return `Faltam ${Math.max(0, goal.targetXp - goal.earnedXp)} XP para a meta do dia.`;
}
