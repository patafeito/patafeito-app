import { categoryLabel, type TaskCategory, type TaskDifficulty } from './task';

/** Opções compartilhadas pelo formulário de criação e pelo editor. */
export const difficultyOptions: { value: TaskDifficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil · 10 XP' },
  { value: 'medium', label: 'Média · 20 XP' },
  { value: 'hard', label: 'Difícil · 40 XP' },
];

export const categoryOptions = (Object.keys(categoryLabel) as TaskCategory[]).map((value) => ({ value, label: categoryLabel[value] }));
