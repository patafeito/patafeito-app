import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { refreshNotifications } from '../../notifications/application/refresh-notifications';
import { notificationPermission, requestNotificationPermission } from '../../notifications/infrastructure/local-scheduler';
import { syncInBackground } from '../../sync/application/sync-startup';
import * as repository from '../infrastructure/local-focus-repository';
import { loadBreakEndsAt, saveBreakEndsAt } from '../infrastructure/focus-settings-repository';
import { remainingSeconds, type FocusSession } from '../domain/focus-session';

export function useFocusSession() {
  const [session, setSession] = useState<FocusSession>();
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [breakEndsAt, setBreakEndsAt] = useState<number>();
  const [breakRemaining, setBreakRemaining] = useState(0);
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
    const stored = await repository.activeSession();
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
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void load(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [load, tick]);

  const endBreak = useCallback(async () => {
    await saveBreakEndsAt(null);
    setBreakEndsAt(undefined);
    setBreakRemaining(0);
    void refreshNotifications();
  }, []);

  const start = useCallback(async (taskId?: string | null, durationSeconds?: number) => {
    await endBreak();
    const started = await repository.startSession(taskId, durationSeconds);
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
    setSession(undefined);
    setRemaining(0);
    void refreshNotifications();
  }, []);

  /** Registra o ciclo e já começa a pausa, se houver. */
  const complete = useCallback(async (breakSeconds = 0) => {
    if (!sessionRef.current) return;
    await repository.completeSession(sessionRef.current);
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

  return { session, remaining, loading, breakEndsAt, breakRemaining, start, pause, resume, cancel, complete, endBreak };
}
