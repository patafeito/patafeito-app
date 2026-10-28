import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusSession } from '../../features/focus/application/use-focus-session';
import {
  BREAK_MINUTES_RANGE, FOCUS_MINUTES_RANGE, focusPresets, focusRewards, formatRemaining, parseMinutes,
  type FocusPresetId, type FocusSettings,
} from '../../features/focus/domain/focus-session';
import { loadFocusSettings, saveFocusSettings } from '../../features/focus/infrastructure/focus-settings-repository';
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
import { ChipGroup } from '../../shared/ui/ChipGroup';
import { ScreenHeader } from '../../shared/ui/Headers';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { Screen } from '../../shared/ui/Screen';
import { TextField } from '../../shared/ui/TextField';
import { useTheme, useThemedStyles, type Theme } from '../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../shared/theme/tokens';

const presetOptions: { value: FocusPresetId; label: string }[] = [
  ...(['classic', 'short', 'long'] as const).map((value) => {
    const preset = focusPresets[value];
    return { value, label: `${preset.label} · ${preset.focusMinutes}/${preset.breakMinutes}` };
  }),
  { value: 'custom', label: 'Personalizada' },
];

async function loadFocusContext() {
  const [pet, tasks, completedSessions] = await Promise.all([loadLocalPet(), listLocalTasks('pending'), countCompletedSessions()]);
  return { pet, tasks: tasks.slice(0, 4), completedSessions };
}

export default function FocusScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { session, remaining, breakEndsAt, breakRemaining, start, pause, resume, cancel, complete, endBreak } = useFocusSession();
  const { data, reload } = useLocalData(loadFocusContext);
  const [taskId, setTaskId] = useState<string>('none');
  const [message, setMessage] = useState<string>();
  const reaction = usePetReaction();
  const [settings, setSettings] = useState<FocusSettings>();
  const [customFocus, setCustomFocus] = useState('25');
  const [customBreak, setCustomBreak] = useState('5');
  const [focusError, setFocusError] = useState<string>();
  const [breakError, setBreakError] = useState<string>();

  useEffect(() => {
    void loadFocusSettings().then((stored) => {
      setSettings(stored);
      setCustomFocus(String(stored.focusMinutes));
      setCustomBreak(String(stored.breakMinutes));
    });
  }, []);

  const species = speciesById(data?.pet?.speciesId);
  const preset = settings?.preset ?? 'classic';
  const planned = preset === 'custom'
    ? { focusMinutes: parseMinutes(customFocus, FOCUS_MINUTES_RANGE), breakMinutes: parseMinutes(customBreak, BREAK_MINUTES_RANGE) }
    : focusPresets[preset];
  const plannedSeconds = (planned.focusMinutes ?? settings?.focusMinutes ?? 25) * 60;
  const durationSeconds = session?.durationSeconds ?? plannedSeconds;
  const reward = focusRewards(durationSeconds);
  const breakSeconds = (settings?.breakMinutes ?? 5) * 60;
  const onBreak = !session && !!breakEndsAt;
  const breakOver = onBreak && breakRemaining === 0;
  const breaking = onBreak && !breakOver;
  const finished = !!session && remaining === 0;
  const elapsed = durationSeconds - remaining;
  const linkedTask = data?.tasks.find((task) => task.id === session?.taskId);

  function choosePreset(value: FocusPresetId) {
    setFocusError(undefined);
    setBreakError(undefined);
    setSettings((current) => ({ focusMinutes: 25, breakMinutes: 5, ...current, preset: value }));
  }

  /** Valida os minutos personalizados toda vez que um ciclo começa. */
  async function begin() {
    const { focusMinutes, breakMinutes } = planned;
    setFocusError(focusMinutes === undefined ? `Digite de ${FOCUS_MINUTES_RANGE.min} a ${FOCUS_MINUTES_RANGE.max} minutos.` : undefined);
    setBreakError(breakMinutes === undefined ? `Digite de ${BREAK_MINUTES_RANGE.min} a ${BREAK_MINUTES_RANGE.max} minutos.` : undefined);
    if (focusMinutes === undefined || breakMinutes === undefined) return;
    const chosen: FocusSettings = { preset, focusMinutes, breakMinutes };
    setSettings(chosen);
    await saveFocusSettings(chosen);
    setMessage(undefined);
    await start(taskId === 'none' ? null : taskId, focusMinutes * 60);
  }

  async function finish() {
    const earned = `+${reward.xp} XP e ${reward.coins} moedas`;
    await complete(breakSeconds);
    setMessage(`Ciclo concluído! ${earned}, a confirmar pelo servidor.`);
    celebrate('cheer', { message: `Ciclo de foco fechado! ${earned}, a confirmar.` });
    await reload();
  }

  const ambient = useAmbientPose(moodFor(data?.pet), !session && !reaction);
  const petState: PetVisualState = reaction?.state ?? (finished ? 'cheer'
    : breaking ? 'happy'
      : !session ? ambient
        : session.status === 'paused' ? 'tired' : 'focus');

  const running = !!session && !finished;
  const phaseLabel = breaking ? 'Pausa' : breakOver ? 'Pausa encerrada' : finished ? 'Ciclo completo' : session?.status === 'paused' ? 'Pausado' : session ? 'Em foco' : 'Pronto para começar';

  // Tela calma: fundo liso, sem cenário, sem cards competindo com o relógio.
  return <Screen edges={['top', 'left', 'right']}>
    <ScreenHeader title="Foco" subtitle={running ? undefined : `${species.name} acompanha seus ciclos`} />

    <View style={styles.timerArea}>
      {data?.pet ? <PetSprite species={speciesById(data.pet.speciesId).id} state={petState} height={running ? 104 : 120} /> : null}
      <View style={[styles.phase, (breaking || finished) && styles.phaseRest]}>
        <Text style={[styles.phaseText, (breaking || finished) && styles.phaseTextRest]}>{phaseLabel}</Text>
      </View>
      <Text style={styles.timer} accessibilityRole="timer" accessibilityLabel={`Tempo restante ${formatRemaining(session ? remaining : breaking ? breakRemaining : plannedSeconds)}`}>
        {formatRemaining(session ? remaining : breaking ? breakRemaining : plannedSeconds)}
      </Text>
      <ProgressBar
        value={session ? elapsed : breaking ? breakSeconds - breakRemaining : 0}
        max={breaking ? breakSeconds : durationSeconds}
        tone={finished || breaking ? 'habit' : 'water'}
        height={12}
        label="Progresso do ciclo"
      />
      <Text style={styles.caption}>
        {breakOver ? 'Bora para o próximo ciclo?'
          : onBreak ? 'Respire, beba água, alongue. O próximo ciclo espera por você.'
            : !session ? `Um ciclo de ${plannedSeconds / 60} minutos vale ${reward.xp} XP e ${reward.coins} moedas.`
              : finished ? 'Registre para receber a recompensa.'
                : session.status === 'paused' ? 'Retome quando estiver pronto.'
                  : linkedTask ? `Focando em “${linkedTask.title}”.` : 'Um passo de cada vez.'}
      </Text>
    </View>

    {breaking ? <Button label="Pular pausa" variant="secondary" onPress={() => void endBreak()} />
      : !session ? <>
        <Button label="Iniciar foco" icon="play" onPress={() => void begin()} />
        <View style={styles.settings}>
          <ChipGroup label="Ritmo" options={presetOptions} value={preset} onChange={choosePreset} />
          {preset === 'custom' ? <View style={styles.customRow}>
            <View style={styles.customField}>
              <TextField
                label="Foco (min)"
                value={customFocus}
                onChangeText={(text) => { setCustomFocus(text); setFocusError(undefined); }}
                keyboardType="number-pad"
                maxLength={3}
                error={focusError}
                hint={`De ${FOCUS_MINUTES_RANGE.min} a ${FOCUS_MINUTES_RANGE.max}`}
              />
            </View>
            <View style={styles.customField}>
              <TextField
                label="Pausa (min)"
                value={customBreak}
                onChangeText={(text) => { setCustomBreak(text); setBreakError(undefined); }}
                keyboardType="number-pad"
                maxLength={2}
                error={breakError}
                hint={`De ${BREAK_MINUTES_RANGE.min} a ${BREAK_MINUTES_RANGE.max}`}
              />
            </View>
          </View> : null}
          {data?.tasks.length ? <ChipGroup
            label="Vincular a uma tarefa (opcional)"
            options={[{ value: 'none', label: 'Sem tarefa' }, ...data.tasks.map((task) => ({ value: task.id, label: task.title.slice(0, 24) }))]}
            value={taskId}
            onChange={setTaskId}
          /> : null}
        </View>
      </> : finished ? <Button label="Registrar ciclo" icon="checkmark" onPress={() => void finish()} />
        : <View style={styles.controls}>
          <View style={styles.control}><Button label={session.status === 'paused' ? 'Retomar' : 'Pausar'} icon={session.status === 'paused' ? 'play' : 'pause'} variant="secondary" onPress={() => void (session.status === 'paused' ? resume() : pause())} /></View>
          <View style={styles.control}><Button label="Cancelar" variant="ghost" onPress={() => void cancel()} /></View>
        </View>}

    {message ? <Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text> : null}

    {!running ? <View style={styles.footer}>
      <Ionicons name="water-outline" size={16} color={colors.textSecondary} />
      <Text style={styles.footerText}>{data?.completedSessions ?? 0} {data?.completedSessions === 1 ? 'ciclo concluído' : 'ciclos concluídos'} neste aparelho · {species.mission}</Text>
    </View> : null}
  </Screen>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  timerArea: { alignItems: 'stretch', gap: spacing.md, paddingVertical: spacing.lg },
  phase: { alignSelf: 'center', paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  phaseRest: { backgroundColor: colors.successSoft },
  phaseText: { ...typography.caption, color: colors.onPrimarySoft, textTransform: 'uppercase', letterSpacing: 1 },
  phaseTextRest: { color: colors.onSuccessSoft },
  timer: { ...typography.timer, color: colors.text, textAlign: 'center' },
  caption: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center' },
  settings: { gap: spacing.md, marginTop: spacing.sm },
  customRow: { flexDirection: 'row', gap: spacing.md },
  customField: { flex: 1 },
  controls: { flexDirection: 'row', gap: spacing.sm },
  control: { flex: 1 },
  message: { ...typography.bodySm, color: colors.success, textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: spacing.sm },
  footerText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
});
