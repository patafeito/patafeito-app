import { authSession } from '../../../shared/network/auth-session';
import { loadBreakEndsAt } from '../../focus/infrastructure/focus-settings-repository';
import { activeSession } from '../../focus/infrastructure/local-focus-repository';
import { loadLocalPet } from '../../pet/infrastructure/local-pet-repository';
import { cachedBoosts } from '../../shop/infrastructure/shop-repository';
import { listCompletionDates, listLocalTasks } from '../../tasks/infrastructure/local-task-repository';
import { planNotifications } from '../domain/planner';
import { cancelScheduledNotifications, notificationPermission, replaceScheduledNotifications } from '../infrastructure/local-scheduler';
import { loadNotificationPreferences } from '../infrastructure/notification-preferences';

let running: Promise<void> | undefined;
let queued = false;

async function replan() {
  if (!(await authSession.hasSession())) return cancelScheduledNotifications();
  if ((await notificationPermission()) !== 'granted') return;
  const [preferences, pet, tasks, completionDates, boosts, focus, breakEndsAt] = await Promise.all([
    loadNotificationPreferences(), loadLocalPet(), listLocalTasks(), listCompletionDates(), cachedBoosts(), activeSession(), loadBreakEndsAt(),
  ]);
  await replaceScheduledNotifications(planNotifications({
    now: new Date(), preferences, pet, tasks, completionDates, protectedDates: boosts.protectedDates, focus, breakEndsAt,
  }));
}

/**
 * Replaneja os avisos locais a partir do estado do aparelho. Chamadas seguidas viram no máximo
 * uma execução extra, para o resultado sempre refletir o último estado.
 */
export function refreshNotifications(): Promise<void> {
  if (running) {
    queued = true;
    return running;
  }
  running = replan().catch(() => undefined).finally(() => {
    running = undefined;
    if (queued) {
      queued = false;
      void refreshNotifications();
    }
  });
  return running;
}
