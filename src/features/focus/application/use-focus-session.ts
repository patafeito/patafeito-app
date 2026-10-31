import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { refreshNotifications } from '../../notifications/application/refresh-notifications';
import { cancelFocusNudge, notificationPermission, requestNotificationPermission, scheduleFocusNudge } from '../../notifications/infrastructure/local-scheduler';
import { syncInBackground } from '../../sync/application/sync-startup';
import * as repository from '../infrastructure/local-focus-repository';
import { loadBreakEndsAt, loadFocusGuard, saveBreakEndsAt, saveFocusGuard } from '../infrastructure/focus-settings-repository';
import { FOCUS_MODE_GRACE_MS, FOCUS_MODE_NUDGE_MS, remainingSeconds, type FocusPresetId, type FocusSession } from '../domain/focus-session';

/**
 * Saiu do app no modo foco por mais que a tolerância, antes de o ciclo acabar? Sair depois do fim
 * (ou já com o ciclo pausado) não conta: o tempo de foco foi cumprido.
 */
function leftTooLong(session: FocusSession, leftAt: number, now = Date.now()) {
  if (session.status !== 'active') return false;
  const endsAt = new Date(session.startedAt).getTime() + session.durationSeconds * 1000;
  return Math.min(now, endsAt) - leftAt > FOCUS_MODE_GRACE_MS;
}

/** No modo foco, anota quando a pessoa saiu e agenda o lembrete para voltar. */
async function markLeft(current: FocusSession | undefined) {
  const guard = await loadFocusGuard();
  if (!current || current.status !== 'active' || guard?.sessionId !== current.id || guard.leftAt) return;
  await saveFocusGuard({ sessionId: current.id, leftAt: Date.now() });
  await scheduleFocusNudge(FOCUS_MODE_NUDGE_MS / 1000);
}

export function useFocusSession() {
  const [session, setSession] = useState<FocusSession>();
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [breakEndsAt, setBreakEndsAt] = useState<number>();
  const [breakRemaining, setBreakRemaining] = useState(0);
  const [guarded, setGuarded] = useState(false);
  /** Mensagem quando o modo foco interrompeu o ciclo porque a pessoa saiu do app. */
  const [interrupted, setInterrupted] = useState<string>();
  const breakRef = useRef<number | undefined>(undefined);
  useEffect(() => { breakRef.current = breakEndsAt; }, [breakEndsAt]);
  const sessionRef = useRef<FocusSession | undefined>(undefined);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const tick = useCallback(() => {
    const current = sessionRef.current;
    setRemaining(current ? remainingSeconds(current) : 0);
    setBreakRemaining(breakRef.current ? Math.max(0, Math.ceil((breakRef.current - Date.now()) / 1000)) : 0);
  }, []);

  const load = useCallback(async () => {
    let stored = await repository.activeSession();
    const guard = await loadFocusGuard();
    if (guard && guard.sessionId !== stored?.id) await saveFocusGuard(null);
    else if (guard && stored) {
      if (guard.leftAt && leftTooLong(stored, guard.leftAt)) {
        await repository.cancelSession(stored);
        await saveFocusGuard(null);
        stored = undefined;
        setInterrupted('Ciclo interrompido: você ficou mais de 1 minuto fora do app no modo foco. Ele não vale XP.');
        void refreshNotifications();
      } else if (guard.leftAt) await saveFocusGuard({ sessionId: guard.sessionId });
      await cancelFocusNudge();
    }
    setGuarded(!!stored && (await loadFocusGuard())?.sessionId === stored.id);
    setSession(stored);
    setRemaining(stored ? remainingSeconds(stored) : 0);
    const storedBreak = await loadBreakEndsAt();
    setBreakEndsAt(storedBreak);
    setBreakRemaining(storedBreak ? Math.max(0, Math.ceil((storedBreak - Date.now()) / 1000)) : 0);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
      else if (state === 'background') void markLeft(sessionRef.current);
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [load, tick]);

  /** Liga ou desliga o modo anti-distração para a sessão atual. */
  const setFocusMode = useCallback(async (enabled: boolean) => {
    const current = sessionRef.current;
    await saveFocusGuard(enabled && current ? { sessionId: current.id } : null);
    setGuarded(enabled && !!current);
  }, []);

  const endBreak = useCallback(async () => {
    await saveBreakEndsAt(null);
    setBreakEndsAt(undefined);
    setBreakRemaining(0);
    void refreshNotifications();
  }, []);

  const start = useCallback(async (taskId?: string | null, durationSeconds?: number, mode?: FocusPresetId, focusMode = false) => {
    await endBreak();
    setInterrupted(undefined);
    const started = await repository.startSession(taskId, durationSeconds, mode);
    await saveFocusGuard(focusMode ? { sessionId: started.id } : null);
    setGuarded(focusMode);
    setSession(started);
    setRemaining(remainingSeconds(started));
    // Momento natural para pedir permissão: avisar quando o ciclo acabar com o app fechado.
    if ((await notificationPermission()) === 'undetermined') await requestNotificationPermission();
    void refreshNotifications();
  }, [endBreak]);

  const pause = useCallback(async () => {
    if (!sessionRef.current) return;
    setSession(await repository.pauseSession(sessionRef.current));
    void refreshNotifications();
  }, []);

  const resume = useCallback(async () => {
    if (!sessionRef.current) return;
    const resumed = await repository.resumeSession(sessionRef.current);
    setSession(resumed);
    setRemaining(remainingSeconds(resumed));
    void refreshNotifications();
  }, []);

  const cancel = useCallback(async () => {
    if (!sessionRef.current) return;
    await repository.cancelSession(sessionRef.current);
    await saveFocusGuard(null);
    setGuarded(false);
    setSession(undefined);
    setRemaining(0);
    void refreshNotifications();
  }, []);

  /** Registra o ciclo e já começa a pausa, se houver. */
  const complete = useCallback(async (breakSeconds = 0) => {
    if (!sessionRef.current) return;
    await repository.completeSession(sessionRef.current);
    await saveFocusGuard(null);
    setGuarded(false);
    setSession(undefined);
    setRemaining(0);
    if (breakSeconds > 0) {
      const endsAt = Date.now() + breakSeconds * 1000;
      await saveBreakEndsAt(endsAt);
      setBreakEndsAt(endsAt);
      setBreakRemaining(breakSeconds);
    }
    void refreshNotifications();
    syncInBackground();
  }, []);

  return {
    session, remaining, loading, breakEndsAt, breakRemaining, guarded, interrupted,
    start, pause, resume, cancel, complete, endBreak, setFocusMode, clearInterrupted: () => setInterrupted(undefined),
  };
}
