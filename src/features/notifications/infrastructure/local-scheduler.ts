import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import type { NotificationChannel, PlannedNotification } from '../domain/planner';

/** Prefixo dos avisos do app, para trocar só os nossos ao replanejar. */
const prefix = 'patafeito:';
const supported = Platform.OS !== 'web';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

const channels: Record<NotificationChannel, Notifications.NotificationChannelInput> = {
  focus: { name: 'Timer de foco', description: 'Fim do ciclo de foco e da pausa.', importance: AndroidImportance.HIGH, vibrationPattern: [0, 250, 150, 250], sound: 'default' },
  reminders: { name: 'Tarefas e sequência', description: 'Tarefas do dia e sequência em risco.', importance: AndroidImportance.DEFAULT },
  pet: { name: 'Seu pato', description: 'Fome, energia e humor do seu pato.', importance: AndroidImportance.DEFAULT },
};

/** No Android 13+, o pedido de permissão só aparece depois que existe ao menos um canal. */
export async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Promise.all(Object.entries(channels).map(([id, channel]) => Notifications.setNotificationChannelAsync(id, channel)));
}

function toPermission(status: Notifications.NotificationPermissionsStatus): NotificationPermission {
  if (status.granted) return 'granted';
  const iosStatus = status.ios?.status;
  if (iosStatus === IosAuthorizationStatus.PROVISIONAL || iosStatus === IosAuthorizationStatus.EPHEMERAL) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
}

export async function notificationPermission(): Promise<NotificationPermission> {
  if (!supported) return 'denied';
  return toPermission(await Notifications.getPermissionsAsync());
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!supported) return 'denied';
  await ensureChannels();
  return toPermission(await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } }));
}

export async function cancelScheduledNotifications() {
  if (!supported) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled
    .filter((request) => request.identifier.startsWith(prefix))
    .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

/** Troca todos os avisos agendados do app pelos planejados agora. */
export async function replaceScheduledNotifications(planned: PlannedNotification[]) {
  if (!supported) return;
  await cancelScheduledNotifications();
  for (const item of planned) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${prefix}${item.id}`,
      content: { title: item.title, body: item.body, data: { url: item.url }, sound: item.channel === 'focus' ? 'default' : undefined },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date, channelId: item.channel },
    });
  }
}

/** Fora do prefixo de propósito: replanejar os avisos não pode apagar o lembrete do modo foco. */
const focusNudgeId = 'focus-nudge';

/** Lembrete para voltar ao app logo depois de sair durante o modo foco. */
export async function scheduleFocusNudge(seconds: number) {
  if (!supported) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: focusNudgeId,
      content: { title: 'Volte ao foco!', body: 'Seu ciclo continua. Se ficar mais de 1 minuto fora, ele é interrompido e não vale XP.', sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: 'focus' },
    });
  } catch {
    // Sem permissão de notificação, o modo foco segue valendo; só não há o lembrete.
  }
}

export async function cancelFocusNudge() {
  if (!supported) return;
  await Notifications.cancelScheduledNotificationAsync(focusNudgeId).catch(() => undefined);
}
