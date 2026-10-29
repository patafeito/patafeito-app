import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { useSession } from '../features/auth/application/session-context';
import { countCompletedSessions } from '../features/focus/infrastructure/local-focus-repository';
import { NotificationSettingsCard } from '../features/notifications/components/NotificationSettingsCard';
import { loadLocalPet } from '../features/pet/infrastructure/local-pet-repository';
import { ChangePasswordCard, EditProfileCard, ResetProgressCard } from '../features/profile/components/AccountForms';
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
  const [pet, completionDates, completedTasks, completedSessions, pendingOperations, boosts] = await Promise.all([
    loadLocalPet(), listCompletionDates(), countCompletedTasks(), countCompletedSessions(), pendingOperationCount(), cachedBoosts(),
  ]);
  const balance = (await refreshBalance().catch(() => undefined)) ?? (await cachedBalance());
  return { pet, streak: currentStreak(completionDates, new Date(), boosts.protectedDates), completedTasks, completedSessions, pendingOperations, balance };
}

export default function ProfileScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors, preference, setPreference } = useTheme();
  const { signOut } = useSession();
  const { data, reload } = useLocalData(loadProfile);
  const [signingOut, setSigningOut] = useState(false);

  return <Screen edges={['left', 'right', 'bottom']}>
    <SectionHeader title="Conta" />
    <EditProfileCard />

    <SectionHeader title="Progresso" actionLabel="Conquistas" onAction={() => router.push('/achievements')} />
    <Card>
      <Row icon="sparkles" label="Experiência confirmada" value={`${data?.balance?.xpTotal ?? data?.pet?.xpTotal ?? 0} XP`} />
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
  footnote: { ...typography.caption, color: colors.textSecondary },
});
