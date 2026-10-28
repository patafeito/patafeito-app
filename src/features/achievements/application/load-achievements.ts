import { countCompletedSessions } from '../../focus/infrastructure/local-focus-repository';
import { levelForXp } from '../../pet/domain/progression';
import { loadLocalPet } from '../../pet/infrastructure/local-pet-repository';
import { cachedBoosts, listLocalInventory } from '../../shop/infrastructure/shop-repository';
import { countCompletedTasks, listCompletionDates } from '../../tasks/infrastructure/local-task-repository';
import { evaluateAchievements, longestStreak, nextAchievement } from '../domain/catalog';

/** Lê as métricas locais e devolve todas as conquistas com progresso, mais a próxima a sair. */
export async function loadAchievements() {
  const [pet, completionDates, completedTasks, focusSessions, boosts, inventory] = await Promise.all([
    loadLocalPet(), listCompletionDates(), countCompletedTasks(), countCompletedSessions(), cachedBoosts(), listLocalInventory(),
  ]);
  const progress = evaluateAchievements({
    completedTasks,
    focusSessions,
    bestStreak: longestStreak(completionDates, boosts.protectedDates),
    level: levelForXp(pet?.xpTotal ?? 0),
    itemsOwned: inventory.length,
  });
  return { progress, unlocked: progress.filter((item) => item.unlocked).length, next: nextAchievement(progress) };
}
