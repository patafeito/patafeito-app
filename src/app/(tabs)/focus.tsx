import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useFocusSession } from '../../features/focus/application/use-focus-session';
import { formatRemaining, POMODORO_DURATION_SECONDS } from '../../features/focus/domain/focus-session';
import { countCompletedSessions } from '../../features/focus/infrastructure/local-focus-repository';
import { speciesById } from '../../features/onboarding/domain/species';
import { celebrate, usePetReaction } from '../../features/pet/application/pet-mood';
import { useAmbientPose } from '../../features/pet/application/use-ambient-pose';
import { PetSprite } from '../../features/pet/components/PetSprite';
import { moodFor, type PetVisualState } from '../../features/pet/domain/pet-sprites';
import { loadLocalPet } from '../../features/pet/infrastructure/local-pet-repository';
import { listLocalTasks } from '../../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { ChipGroup } from '../../shared/ui/ChipGroup';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { Screen } from '../../shared/ui/Screen';
import { colors, spacing, typography } from '../../shared/theme/tokens';

async function loadFocusContext() {
  const [pet, tasks, completedSessions] = await Promise.all([loadLocalPet(), listLocalTasks('pending'), countCompletedSessions()]);
  return { pet, tasks: tasks.slice(0, 4), completedSessions };
}

export default function FocusScreen() {
  const { session, remaining, start, pause, resume, cancel, complete } = useFocusSession();
  const { data, reload } = useLocalData(loadFocusContext);
  const [taskId, setTaskId] = useState<string>('none');
  const [message, setMessage] = useState<string>();
  const reaction = usePetReaction();

  const species = speciesById(data?.pet?.speciesId);
  const finished = !!session && remaining === 0;
  const elapsed = POMODORO_DURATION_SECONDS - remaining;
  const linkedTask = data?.tasks.find((task) => task.id === session?.taskId);

  async function finish() {
    await complete();
    setMessage('Ciclo concluído! +20 XP e 4 moedas, a confirmar pelo servidor.');
    celebrate('cheer', { message: 'Ciclo de foco fechado! +20 XP e 4 moedas, a confirmar.' });
    await reload();
  }

  const ambient = useAmbientPose(moodFor(data?.pet), !session && !reaction);
  const petState: PetVisualState = reaction?.state ?? (finished ? 'cheer'
    : !session ? ambient
      : session.status === 'paused' ? 'tired' : 'focus');

  return <Screen>
    <Text style={styles.title}>Foco</Text>
    <Card tone="raised" style={styles.timerCard}>
      {data?.pet ? <PetSprite species={speciesById(data.pet.speciesId).id} state={petState} height={132} /> : null}
      <Text style={styles.timer}>{formatRemaining(session ? remaining : POMODORO_DURATION_SECONDS)}</Text>
      <ProgressBar value={session ? elapsed : 0} max={POMODORO_DURATION_SECONDS} color={finished ? colors.success : colors.primary} height={10} />
      <Text style={styles.caption}>
        {!session ? 'Um ciclo de 25 minutos, uma coisa de cada vez.'
          : finished ? 'Ciclo completo. Registre para receber a recompensa.'
            : session.status === 'paused' ? 'Pausado. Retome quando estiver pronto.'
              : linkedTask ? `Focando em “${linkedTask.title}”.` : 'Em foco.'}
      </Text>
    </Card>

    {!session ? <>
      {data?.tasks.length ? <ChipGroup
        label="Vincular a uma tarefa (opcional)"
        options={[{ value: 'none', label: 'Sem tarefa' }, ...data.tasks.map((task) => ({ value: task.id, label: task.title.slice(0, 24) }))]}
        value={taskId}
        onChange={setTaskId}
      /> : null}
      <Button label="Iniciar foco" onPress={() => void start(taskId === 'none' ? null : taskId)} />
    </> : finished ? <Button label="Registrar ciclo" onPress={() => void finish()} />
      : <>
        <Button label={session.status === 'paused' ? 'Retomar' : 'Pausar'} variant="secondary" onPress={() => void (session.status === 'paused' ? resume() : pause())} />
        <Button label="Cancelar ciclo" variant="ghost" onPress={() => void cancel()} />
      </>}

    {message ? <Text style={styles.message}>{message}</Text> : null}

    <Card>
      <Text style={styles.cardTitle}>{species.name} acompanha</Text>
      <Text style={styles.muted}>{species.mission}</Text>
      <Text style={styles.muted}>Ciclos concluídos neste aparelho: {data?.completedSessions ?? 0}</Text>
    </Card>
  </Screen>;
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text, fontSize: 26 },
  timerCard: { alignItems: 'stretch', gap: spacing.md },
  timer: { ...typography.numeric, color: colors.text, fontSize: 64, textAlign: 'center' },
  caption: { ...typography.body, color: colors.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  cardTitle: { ...typography.heading, color: colors.text, fontSize: 17, marginBottom: spacing.xs },
  muted: { ...typography.body, color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  message: { ...typography.body, color: colors.success, fontSize: 14 },
});
