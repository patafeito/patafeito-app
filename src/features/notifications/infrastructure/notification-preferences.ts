import { localProfile } from '../../../shared/storage/local-profile';
import { defaultNotificationPreferences, type NotificationPreferences } from '../domain/planner';

const preferencesKey = 'notifications.preferences';
const promptKey = 'notifications.promptDismissed';

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  const value = await localProfile.get(preferencesKey);
  return value ? { ...defaultNotificationPreferences, ...(JSON.parse(value) as Partial<NotificationPreferences>) } : defaultNotificationPreferences;
}

export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  await localProfile.set(preferencesKey, JSON.stringify(preferences));
}

/** O convite para ativar lembretes na tela inicial aparece até o usuário responder. */
export async function wasNotificationPromptDismissed() {
  return (await localProfile.get(promptKey)) === '1';
}

export async function dismissNotificationPrompt() {
  await localProfile.set(promptKey, '1');
}
