import type { Species } from '../../onboarding/domain/species';
import { difficultyLabel, type Task } from '../../tasks/domain/task';

export type Recommendation = { title: string; body: string; action: { label: string; href: '/(tabs)/tasks' | '/(tabs)/focus' | '/(tabs)/habits' } };

const difficultyOrder = { easy: 0, medium: 1, hard: 2 } as const;

export function buildRecommendation(species: Species, state: { pendingTasks: Task[]; streak: number }): Recommendation {
  const [next] = [...state.pendingTasks].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);

  if (species.id === 'mare') {
    return next
      ? { title: species.recommendation, body: `Leve “${next.title}” para um ciclo de 25 minutos.`, action: { label: 'Iniciar foco', href: '/(tabs)/focus' } }
      : { title: species.recommendation, body: 'Um ciclo de foco de 25 minutos já conta como progresso.', action: { label: 'Iniciar foco', href: '/(tabs)/focus' } };
  }

  if (species.id === 'bento') {
    if (state.streak > 0) return { title: species.recommendation, body: `Você está há ${state.streak} ${state.streak === 1 ? 'dia' : 'dias'} seguidos. Marque um hábito hoje para manter.`, action: { label: 'Ver hábitos', href: '/(tabs)/habits' } };
    return { title: 'Comece uma sequência', body: 'Um hábito pequeno, todo dia, abre sua primeira sequência.', action: { label: 'Ver hábitos', href: '/(tabs)/habits' } };
  }

  return next
    ? { title: species.recommendation, body: `“${next.title}” (${difficultyLabel[next.difficulty].toLowerCase()}) é o menor próximo passo.`, action: { label: 'Ver tarefas', href: '/(tabs)/tasks' } }
    : { title: species.recommendation, body: 'Crie uma tarefa curta: uma tarefa clara já é progresso.', action: { label: 'Criar tarefa', href: '/(tabs)/tasks' } };
}
