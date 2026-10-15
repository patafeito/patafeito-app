export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type Task = { id: string; title: string; difficulty: TaskDifficulty; status: 'pending' | 'completed'; dueAt?: string };
