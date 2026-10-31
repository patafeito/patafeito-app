import { cachedFriendsCount } from '../../friends/infrastructure/friends-api';
import { listCompletedSessions } from '../../focus/infrastructure/local-focus-repository';
import { loadLocalPet } from '../../pet/infrastructure/local-pet-repository';
import { cachedBoosts } from '../../shop/infrastructure/shop-repository';
import { listLocalTasks } from '../../tasks/infrastructure/local-task-repository';
import type { ReportInput } from '../domain/aggregate';

/** Tudo o que o histórico e os relatórios precisam, lido do SQLite (funciona offline). */
export async function loadReportData(): Promise<ReportInput & { xpTotal: number; friends: number }> {
  const [tasks, sessions, boosts, pet, friends] = await Promise.all([listLocalTasks(), listCompletedSessions(), cachedBoosts(), loadLocalPet(), cachedFriendsCount()]);
  return { tasks, sessions, protectedDates: boosts.protectedDates, xpTotal: pet?.xpTotal ?? 0, friends };
}
