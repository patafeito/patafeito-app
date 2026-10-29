import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useTheme, useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { spacing, typography } from '../../../shared/theme/tokens';
import { refreshNotifications } from '../application/refresh-notifications';
import { notificationPermission, requestNotificationPermission } from '../infrastructure/local-scheduler';
import { dismissNotificationPrompt, wasNotificationPromptDismissed } from '../infrastructure/notification-preferences';

/** Convite na tela inicial, com contexto, em vez de pedir permissão logo ao abrir o app. Some depois de respondido. */
export function NotificationPrompt({ petName }: { petName: string }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void (async () => {
      const [permission, dismissed] = await Promise.all([notificationPermission(), wasNotificationPromptDismissed()]);
      setVisible(permission === 'undetermined' && !dismissed);
    })();
  }, []);

  async function answer(enable: boolean) {
    setVisible(false);
    await dismissNotificationPrompt();
    if (enable && (await requestNotificationPermission()) === 'granted') void refreshNotifications();
  }

  if (!visible) return null;
  return <Card style={styles.card}>
    <View style={styles.row}>
      <Ionicons name="notifications" size={22} color={colors.primary} />
      <View style={styles.text}>
        <Text style={styles.title}>Quer que {petName} te lembre?</Text>
        <Text style={styles.body}>Avisos das tarefas do dia, do timer de foco e de quando ele precisar de você. Nada entre 22h e 8h.</Text>
      </View>
    </View>
    <View style={styles.actions}>
      <View style={styles.action}><Button label="Agora não" variant="ghost" size="compact" onPress={() => void answer(false)} /></View>
      <View style={styles.action}><Button label="Ativar lembretes" variant="tertiary" size="compact" onPress={() => void answer(true)} /></View>
    </View>
  </Card>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  card: { gap: spacing.ms },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.ms },
  text: { flex: 1, gap: spacing.xs },
  title: { ...typography.subheading, color: colors.text },
  body: { ...typography.bodySm, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
