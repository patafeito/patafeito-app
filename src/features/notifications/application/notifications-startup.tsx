import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { router, type Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useSession } from '../../auth/application/session-context';
import { onSynchronized } from '../../sync/application/sync-engine';
import { cancelScheduledNotifications, ensureChannels } from '../infrastructure/local-scheduler';
import { refreshNotifications } from './refresh-notifications';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

function openFrom(response: Notifications.NotificationResponse | null | undefined) {
  const url = response?.notification.request.content.data?.url;
  if (typeof url !== 'string' || !url.startsWith('/')) return;
  router.push(url as Href);
  void Notifications.clearLastNotificationResponseAsync();
}

/**
 * Mantém os avisos locais em dia: replaneja ao abrir o app, ao ir para o fundo (o estado mais recente
 * antes do usuário sair) e depois de cada sincronização. Ao sair da conta, cancela tudo.
 */
export function NotificationsStartup() {
  const { status } = useSession();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handled = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (status === 'signed-out') {
      void cancelScheduledNotifications().catch(() => undefined);
      return;
    }
    if (status !== 'signed-in') return;
    void ensureChannels().catch(() => undefined).then(refreshNotifications);
    const appState = AppState.addEventListener('change', (state) => { if (state !== 'inactive') void refreshNotifications(); });
    const unsubscribe = onSynchronized(() => { void refreshNotifications(); });
    return () => { appState.remove(); unsubscribe(); };
  }, [status]);

  // Toque numa notificação (com o app aberto ou abrindo por ela) leva à tela certa, só com sessão ativa.
  useEffect(() => {
    if (status !== 'signed-in' || !lastResponse || lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = lastResponse.notification.request.identifier + lastResponse.notification.date;
    if (handled.current === id) return;
    const timer = setTimeout(() => { handled.current = id; openFrom(lastResponse); }, 0);
    return () => clearTimeout(timer);
  }, [status, lastResponse]);

  return null;
}
