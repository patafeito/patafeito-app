import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusSession } from '../features/focus/application/use-focus-session';
import { formatRemaining } from '../features/focus/domain/focus-session';
import { speciesById } from '../features/onboarding/domain/species';
import { PetSprite } from '../features/pet/components/PetSprite';
import { loadLocalPet } from '../features/pet/infrastructure/local-pet-repository';
import { listLocalTasks } from '../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../shared/hooks/use-local-data';
import { Button } from '../shared/ui/Button';
import { useConfirm } from '../shared/ui/ConfirmDialog';
import { ProgressBar } from '../shared/ui/ProgressBar';
import { useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../shared/theme/tokens';

async function loadContext() {
  const [pet, tasks] = await Promise.all([loadLocalPet(), listLocalTasks('pending')]);
  return { pet, tasks };
}

/**
 * Modo foco (HU17): tela cheia, sem abas e com a tela acesa. Sair do app por mais de 1 minuto
 * interrompe o ciclo sem recompensa (RN04); a regra mora em `useFocusSession`, que também a
 * aplica quando o app é reaberto depois de fechado pelo sistema.
 */
export default function FocusModeScreen() {
  useKeepAwake();
  const styles = useThemedStyles(makeStyles);
  const { session, remaining, interrupted, pause, resume, cancel, setFocusMode } = useFocusSession();
  const { data } = useLocalData(loadContext);
  const { confirm, dialog } = useConfirm();

  const finished = !!session && remaining === 0;
  const task = data?.tasks.find((item) => item.id === session?.taskId);
  const species = speciesById(data?.pet?.speciesId);

  async function leaveFocusMode() {
    await setFocusMode(false);
    router.back();
  }

  function giveUp() {
    confirm({
      title: 'Desistir do ciclo?',
      message: 'O tempo até aqui não vale XP.',
      confirmLabel: 'Desistir',
      destructive: true,
      onConfirm: () => void cancel().then(() => router.back()),
    });
  }

  return <SafeAreaView style={styles.screen}>
    <View style={styles.content}>
      <Text style={styles.badge}>MODO FOCO</Text>
      {data?.pet ? <PetSprite species={species.id} state={finished ? 'cheer' : session?.status === 'paused' ? 'tired' : 'focus'} height={140} /> : null}

      {session ? <>
        <Text style={styles.timer} accessibilityRole="timer" accessibilityLabel={`Tempo restante ${formatRemaining(remaining)}`}>{formatRemaining(remaining)}</Text>
        <ProgressBar value={session.durationSeconds - remaining} max={session.durationSeconds} tone={finished ? 'habit' : 'water'} height={10} label="Progresso do ciclo" />
        <Text style={styles.caption}>
          {finished ? 'Ciclo completo! Volte para registrar a recompensa.'
            : session.status === 'paused' ? 'Pausado. Retome quando estiver pronto.'
              : task ? `Focando em “${task.title}”.` : `${species.name} está focando com você.`}
        </Text>
      </> : <Text style={styles.caption}>{interrupted ?? 'Nenhum ciclo em andamento.'}</Text>}

      {session && !finished ? <Text style={styles.rule}>Fique por aqui: se sair do app por mais de 1 minuto, inclusive bloqueando a tela, o ciclo é interrompido e não vale XP.</Text> : null}
    </View>

    <View style={styles.actions}>
      {!session || finished ? <Button label={finished ? 'Registrar ciclo' : 'Voltar'} icon={finished ? 'checkmark' : 'arrow-back'} onPress={() => void leaveFocusMode()} />
        : <>
          <Button label={session.status === 'paused' ? 'Retomar' : 'Pausar'} icon={session.status === 'paused' ? 'play' : 'pause'} variant="secondary" onPress={() => void (session.status === 'paused' ? resume() : pause())} />
          <View style={styles.row}>
            <View style={styles.cell}><Button label="Sair do modo foco" variant="ghost" onPress={() => void leaveFocusMode()} /></View>
            <View style={styles.cell}><Button label="Desistir" variant="dangerOutline" onPress={giveUp} /></View>
          </View>
        </>}
    </View>
    {dialog}
  </SafeAreaView>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  content: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: spacing.md },
  badge: { ...typography.caption, alignSelf: 'center', color: colors.onPrimarySoft, backgroundColor: colors.primarySoft, letterSpacing: 2, paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, overflow: 'hidden' },
  timer: { ...typography.timer, color: colors.text, textAlign: 'center' },
  caption: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  rule: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  actions: { gap: spacing.sm, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1 },
});
