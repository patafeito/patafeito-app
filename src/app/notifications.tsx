import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { listFeed, markAllRead, markRead, type FeedItem } from '../features/notifications/infrastructure/feed-repository';
import { syncInBackground } from '../features/sync/application/sync-startup';
import { useLocalData } from '../shared/hooks/use-local-data';
import { Button } from '../shared/ui/Button';
import { EmptyState } from '../shared/ui/EmptyState';
import { SectionHeader } from '../shared/ui/Headers';
import { Screen } from '../shared/ui/Screen';
import { useTheme, useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../shared/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

const iconByType: Record<string, IconName> = {
  task_completed: 'checkmark-circle',
  special_completed: 'star',
  task_due_soon: 'alarm',
  task_overdue: 'alert-circle',
  focus_completed: 'timer',
  pet_hungry: 'restaurant',
  pet_tired: 'flash',
  pet_lonely: 'heart-dislike',
  streak_bonus: 'flame',
  streak_risk: 'flame-outline',
};

/** Para onde o toque leva: tarefas ao contexto das tarefas, alertas do pato à tela dele. */
function destination(item: FeedItem) {
  if (item.data?.taskId || item.type.startsWith('task_') || item.type === 'streak_risk') return '/(tabs)/tasks' as const;
  if (item.type.startsWith('pet_')) return '/(tabs)/pet' as const;
  if (item.type === 'focus_completed') return '/(tabs)/focus' as const;
  return undefined;
}

function dayGroup(createdAt: string, now = new Date()) {
  const date = new Date(createdAt);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return 'Anteriores';
}

/** Central de notificações (Tela 14): prazos, pato, sequência e conquistas, da mais nova para a mais antiga. */
export default function NotificationsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data: items, reload } = useLocalData(listFeed);
  const unread = (items ?? []).filter((item) => !item.readAt).length;
  const groups = ['Hoje', 'Ontem', 'Anteriores']
    .map((title) => ({ title, items: (items ?? []).filter((item) => dayGroup(item.createdAt) === title) }))
    .filter((group) => group.items.length);

  async function open(item: FeedItem) {
    await markRead(item);
    syncInBackground();
    await reload();
    const href = destination(item);
    if (href) router.navigate(href);
  }

  async function readEverything() {
    await markAllRead();
    syncInBackground();
    await reload();
  }

  return <Screen edges={['left', 'right']}>
    {unread ? <View style={styles.toolbar}>
      <Text style={styles.count} accessibilityLiveRegion="polite">{unread} {unread === 1 ? 'não lida' : 'não lidas'}</Text>
      <Button label="Marcar todas" icon="checkmark-done" variant="secondary" size="compact" onPress={() => void readEverything()} />
    </View> : null}

    {!items?.length ? <EmptyState species="pingo" state="happy" title="Nada por aqui" message="Avisos de prazo, do seu pato e da sequência aparecem nesta tela." />
      : groups.map((group) => <View key={group.title} style={styles.group}>
        <SectionHeader title={group.title} />
        {group.items.map((item) => <NotificationRow key={item.id} item={item} onPress={() => void open(item)} />)}
      </View>)}
  </Screen>;
}

function NotificationRow({ item, onPress }: { item: FeedItem; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const unread = !item.readAt;
  const time = new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${unread ? 'Não lida. ' : ''}${item.title}. ${item.body}. ${time}`}
    onPress={onPress}
    style={({ pressed }) => [styles.row, unread && styles.unread, pressed && styles.pressed]}
  >
    <View style={styles.icon}><Ionicons name={iconByType[item.type] ?? 'notifications'} size={20} color={colors.primary} /></View>
    <View style={styles.text}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.time}>{time}</Text>
    </View>
    {unread ? <View style={styles.dot} /> : null}
  </Pressable>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  count: { ...typography.label, color: colors.text },
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.ms, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  unread: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.85 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  text: { flex: 1, gap: 2 },
  title: { ...typography.subheading, color: colors.text },
  body: { ...typography.bodySm, color: colors.textSecondary },
  time: { ...typography.caption, color: colors.textSecondary },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: spacing.xs },
});
