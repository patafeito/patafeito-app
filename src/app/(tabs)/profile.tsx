import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../features/auth/application/session-context';
import { countCompletedSessions } from '../../features/focus/infrastructure/local-focus-repository';
import { loadLocalPet } from '../../features/pet/infrastructure/local-pet-repository';
import { ChangePasswordCard, EditProfileCard, ResetProgressCard } from '../../features/profile/components/AccountForms';
import { cachedBalance, refreshBalance } from '../../features/rewards/infrastructure/balance-repository';
import { pendingOperationCount } from '../../features/sync/infrastructure/sync-repository';
import { cachedBoosts } from '../../features/shop/infrastructure/shop-repository';
import { currentStreak } from '../../features/tasks/domain/task';
import { countCompletedTasks, listCompletionDates } from '../../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Screen } from '../../shared/ui/Screen';
import { colors, spacing, typography } from '../../shared/theme/tokens';

async function loadProfile() {
  const [pet, completionDates, completedTasks, completedSessions, pendingOperations, boosts] = await Promise.all([
    loadLocalPet(), listCompletionDates(), countCompletedTasks(), countCompletedSessions(), pendingOperationCount(), cachedBoosts(),
  ]);
  const balance = (await refreshBalance().catch(() => undefined)) ?? (await cachedBalance());
  return { pet, streak: currentStreak(completionDates, new Date(), boosts.protectedDates), completedTasks, completedSessions, pendingOperations, balance };
}

export default function ProfileScreen() {
  const { signOut } = useSession();
  const { data, reload } = useLocalData(loadProfile);
  const [signingOut, setSigningOut] = useState(false);

  return <Screen>
    <Text style={styles.title}>Seu perfil</Text>

    <EditProfileCard />

    <Card>
      <Text style={styles.cardTitle}>Progresso</Text>
      <View style={styles.rows}>
        <Row label="Experiência confirmada" value={`${data?.balance?.xpTotal ?? data?.pet?.xpTotal ?? 0} XP`} />
        <Row label="Moedas" value={`${data?.balance?.coins ?? 0}`} />
        <Row label="Tarefas concluídas" value={`${data?.completedTasks ?? 0}`} />
        <Row label="Ciclos de foco" value={`${data?.completedSessions ?? 0}`} />
        <Row label="Sequência atual" value={`${data?.streak ?? 0} ${data?.streak === 1 ? 'dia' : 'dias'}`} />
      </View>
    </Card>

    <Card>
      <Text style={styles.cardTitle}>Sincronização</Text>
      <Text style={styles.muted}>
        {data?.pendingOperations ? `${data.pendingOperations} ${data.pendingOperations === 1 ? 'alteração pendente' : 'alterações pendentes'}. Serão enviadas quando a rede voltar.` : 'Tudo sincronizado com o servidor.'}
      </Text>
    </Card>

    <ChangePasswordCard />
    <ResetProgressCard onReset={() => void reload()} />

    <Button
      label={signingOut ? 'Saindo…' : 'Sair da conta'}
      variant="secondary"
      disabled={signingOut}
      onPress={() => { setSigningOut(true); void signOut().finally(() => setSigningOut(false)); }}
    />
    <Text style={styles.footnote}>Sair apaga os dados deste aparelho. Alterações ainda não sincronizadas serão perdidas.</Text>
  </Screen>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.muted}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text, fontSize: 26 },
  cardTitle: { ...typography.heading, color: colors.text, fontSize: 17, marginBottom: spacing.sm },
  muted: { ...typography.body, color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  value: { ...typography.numeric, color: colors.text, fontSize: 15 },
  rows: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  footnote: { ...typography.body, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
