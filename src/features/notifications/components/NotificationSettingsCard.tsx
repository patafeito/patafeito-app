import { useEffect, useState, type ComponentProps } from 'react';
import { AppState, Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useTheme, useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { spacing, typography } from '../../../shared/theme/tokens';
import { refreshNotifications } from '../application/refresh-notifications';
import type { NotificationCategory, NotificationPreferences } from '../domain/planner';
import { notificationPermission, requestNotificationPermission, type NotificationPermission } from '../infrastructure/local-scheduler';
import { loadNotificationPreferences, saveNotificationPreferences } from '../infrastructure/notification-preferences';

const categories: { id: NotificationCategory; icon: ComponentProps<typeof Ionicons>['name']; label: string; description: string }[] = [
  { id: 'focus', icon: 'timer-outline', label: 'Timer de foco', description: 'Fim do ciclo e da pausa.' },
  { id: 'tasks', icon: 'checkmark-circle-outline', label: 'Tarefas do dia', description: 'Às 9h, e às 20h se algo vence hoje.' },
  { id: 'streak', icon: 'flame-outline', label: 'Sequência em risco', description: 'Às 20h, se o dia ainda não conta.' },
  { id: 'pet', icon: 'paw-outline', label: 'Seu pato', description: 'Fome, energia, humor e saudade.' },
];

/** Permissão do sistema e escolha de quais lembretes tocar. Nada toca entre 22h e 8h, exceto o foco. */
export function NotificationSettingsCard() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [permission, setPermission] = useState<NotificationPermission>();
  const [preferences, setPreferences] = useState<NotificationPreferences>();

  useEffect(() => {
    function load() {
      void (async () => {
        const [current, stored] = await Promise.all([notificationPermission(), loadNotificationPreferences()]);
        setPermission(current);
        setPreferences(stored);
      })();
    }
    load();
    // Volta das configurações do aparelho com a permissão possivelmente alterada.
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') load(); });
    return () => subscription.remove();
  }, []);

  async function enable() {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') void refreshNotifications();
  }

  async function toggle(category: NotificationCategory, value: boolean) {
    if (!preferences) return;
    const next = { ...preferences, [category]: value };
    setPreferences(next);
    await saveNotificationPreferences(next);
    void refreshNotifications();
  }

  if (!permission || !preferences) return <Card><Text style={styles.muted}>Carregando…</Text></Card>;

  if (permission !== 'granted') return <Card style={styles.prompt}>
    <View style={styles.promptRow}>
      <Ionicons name="notifications-off-outline" size={22} color={colors.textSecondary} />
      <Text style={styles.muted}>
        {permission === 'denied'
          ? 'As notificações estão desligadas nas configurações do aparelho.'
          : 'Receba avisos do timer, das tarefas do dia e de quando seu pato precisar de você.'}
      </Text>
    </View>
    {permission === 'denied'
      ? <Button label="Abrir configurações" variant="secondary" icon="settings-outline" size="compact" onPress={() => void Linking.openSettings()} />
      : <Button label="Ativar notificações" variant="tertiary" icon="notifications-outline" size="compact" onPress={() => void enable()} />}
  </Card>;

  return <Card>
    {categories.map((category, index) => <View key={category.id} style={[styles.row, index < categories.length - 1 && styles.rowDivider]}>
      <Ionicons name={category.icon} size={20} color={colors.textSecondary} />
      <View style={styles.rowText}>
        <Text style={styles.label}>{category.label}</Text>
        <Text style={styles.description}>{category.description}</Text>
      </View>
      <Switch
        accessibilityLabel={category.label}
        accessibilityHint={category.description}
        value={preferences[category.id]}
        onValueChange={(value) => void toggle(category.id, value)}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.borderStrong}
      />
    </View>)}
  </Card>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  muted: { ...typography.body, color: colors.textSecondary, flex: 1 },
  prompt: { gap: spacing.ms },
  promptRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, paddingVertical: spacing.sm },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  rowText: { flex: 1, gap: 2 },
  label: { ...typography.body, color: colors.text },
  description: { ...typography.caption, color: colors.textSecondary },
});
