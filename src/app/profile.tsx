import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { useSession } from '../features/auth/application/session-context';
import { countCompletedSessions } from '../features/focus/infrastructure/local-focus-repository';
import { NotificationSettingsCard } from '../features/notifications/components/NotificationSettingsCard';
import { unreadCount } from '../features/notifications/infrastructure/feed-repository';
import { speciesById } from '../features/onboarding/domain/species';
import { levelForXp } from '../features/pet/domain/progression';
import { loadLocalPet } from '../features/pet/infrastructure/local-pet-repository';
import { ChangePasswordCard, DeleteAccountCard, EditProfileCard, ResetProgressCard } from '../features/profile/components/AccountForms';
import { cachedBalance, refreshBalance } from '../features/rewards/infrastructure/balance-repository';
import { pendingOperationCount } from '../features/sync/infrastructure/sync-repository';
import { cachedBoosts } from '../features/shop/infrastructure/shop-repository';
import { currentStreak } from '../features/tasks/domain/task';
import { countCompletedTasks, listCompletionDates } from '../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../shared/hooks/use-local-data';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { ChipGroup } from '../shared/ui/ChipGroup';
import { SectionHeader } from '../shared/ui/Headers';
import { Screen } from '../shared/ui/Screen';
import { useTheme, useThemedStyles, type AppearancePreference, type Theme } from '../shared/theme/ThemeProvider';
import { spacing, typography } from '../shared/theme/tokens';

const appearanceOptions: { value: AppearancePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

async function loadProfile() {
  const [pet, completionDates, completedTasks, completedSessions, pendingOperations, boosts, unread] = await Promise.all([
    loadLocalPet(), listCompletionDates(), countCompletedTasks(), countCompletedSessions(), pendingOperationCount(), cachedBoosts(), unreadCount(),
  ]);
  const balance = (await refreshBalance().catch(() => undefined)) ?? (await cachedBalance());
  return { pet, streak: currentStreak(completionDates, new Date(), boosts.protectedDates), completedTasks, completedSessions, pendingOperations, balance, unread };
}

export default function ProfileScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors, preference, setPreference } = useTheme();
  const { signOut, user } = useSession();
  const { data, reload } = useLocalData(loadProfile);
  const [signingOut, setSigningOut] = useState(false);

  const xpTotal = data?.balance?.xpTotal ?? data?.pet?.xpTotal ?? 0;
  const species = speciesById(data?.pet?.speciesId);
  const initials = (user?.displayName ?? '?').trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');

  return <Screen edges={['left', 'right', 'bottom']}>
    <View style={styles.identity}>
      <View style={[styles.avatar, { backgroundColor: colors[species.accent] }]} accessibilityElementsHidden importantForAccessibility="no">
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.identityText}>
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.muted}>{user?.handle ? `@${user.handle}` : user?.email}</Text>
        <Text style={styles.level}>Nível {levelForXp(xpTotal)} · {xpTotal} XP{data?.pet ? ` · com ${data.pet.name}` : ''}</Text>
      </View>
    </View>

    <Card style={styles.menu}>
      <MenuItem icon="calendar-outline" label="Histórico" onPress={() => router.push('/history')} />
      <MenuItem icon="stats-chart-outline" label="Relatórios" onPress={() => router.push('/reports')} />
      <MenuItem icon="people-outline" label="Amigos" onPress={() => router.push('/friends')} />
      <MenuItem icon="notifications-outline" label="Notificações" detail={data?.unread ? `${data.unread} não lidas` : undefined} onPress={() => router.push('/notifications')} />
      <MenuItem icon="trophy-outline" label="Conquistas" onPress={() => router.push('/achievements')} />
      <MenuItem icon="help-circle-outline" label="Como usar o Patafeito" onPress={() => router.push('/tour')} />
      <MenuItem icon="shield-checkmark-outline" label="Privacidade e dados" onPress={() => router.push('/privacy')} last />
    </Card>

    <SectionHeader title="Conta" />
    <EditProfileCard />

    <SectionHeader title="Progresso" />
    <Card>
      <Row icon="sparkles" label="Experiência confirmada" value={`${xpTotal} XP`} />
      <Row icon="trending-up" label="Nível atual" value={String(levelForXp(xpTotal))} />
      <Row icon="ellipse" label="Moedas" value={`${data?.balance?.coins ?? 0}`} />
      <Row icon="checkmark-circle" label="Tarefas concluídas" value={`${data?.completedTasks ?? 0}`} />
      <Row icon="timer" label="Ciclos de foco" value={`${data?.completedSessions ?? 0}`} />
      <Row icon="flame" label="Sequência atual" value={`${data?.streak ?? 0} ${data?.streak === 1 ? 'dia' : 'dias'}`} last />
    </Card>

    <SectionHeader title="Aparência" />
    <ChipGroup variant="segmented" options={appearanceOptions} value={preference} onChange={setPreference} />
    <Text style={styles.footnote}>“Sistema” acompanha o modo claro ou escuro do aparelho.</Text>

    <SectionHeader title="Notificações" />
    <NotificationSettingsCard />

    <SectionHeader title="Sincronização" />
    <Card style={styles.sync}>
      <Ionicons name={data?.pendingOperations ? 'cloud-upload-outline' : 'cloud-done-outline'} size={22} color={data?.pendingOperations ? colors.warning : colors.success} />
      <Text style={styles.muted}>
        {data?.pendingOperations ? `${data.pendingOperations} ${data.pendingOperations === 1 ? 'alteração pendente' : 'alterações pendentes'}. Serão enviadas quando a rede voltar.` : 'Tudo sincronizado com o servidor.'}
      </Text>
    </Card>

    <SectionHeader title="Segurança" />
    <ChangePasswordCard />

    <SectionHeader title="Zona de cuidado" />
    <ResetProgressCard onReset={() => void reload()} />
    <DeleteAccountCard />
    <Button
      label={signingOut ? 'Saindo…' : 'Sair da conta'}
      variant="dangerOutline"
      icon="log-out-outline"
      disabled={signingOut}
      onPress={() => { setSigningOut(true); void signOut().finally(() => setSigningOut(false)); }}
    />
    <Text style={styles.footnote}>Sair apaga os dados deste aparelho. Alterações ainda não sincronizadas serão perdidas.</Text>
  </Screen>;
}

function MenuItem({ icon, label, detail, onPress, last }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; detail?: string; onPress: () => void; last?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={detail ? `${label}, ${detail}` : label} onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.pressed]}>
    <Ionicons name={icon} size={20} color={colors.primary} />
    <Text style={styles.menuLabel}>{label}</Text>
    {detail ? <Text style={styles.menuDetail}>{detail}</Text> : null}
    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
  </Pressable>;
}

function Row({ icon, label, value, last }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; value: string; last?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return <View style={[styles.row, !last && styles.rowDivider]} accessible accessibilityLabel={`${label}: ${value}`}>
    <Ionicons name={icon} size={18} color={colors.textSecondary} />
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  muted: { ...typography.body, color: colors.textSecondary, flex: 1 },
  value: { ...typography.numeric, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, paddingVertical: spacing.sm },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  rowLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  sync: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.title, color: colors.onPrimary },
  identityText: { flex: 1, gap: 2 },
  name: { ...typography.title, color: colors.text },
  level: { ...typography.label, color: colors.primary },
  menu: { paddingVertical: 0 },
  menuLabel: { ...typography.body, color: colors.text, flex: 1 },
  menuDetail: { ...typography.caption, color: colors.textSecondary },
  pressed: { opacity: 0.7 },
  footnote: { ...typography.caption, color: colors.textSecondary },
});
