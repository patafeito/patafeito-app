import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { syncInBackground } from '../../sync/application/sync-startup';
import * as repository from '../infrastructure/local-focus-repository';
import { remainingSeconds, type FocusSession } from '../domain/focus-session';

export function useFocusSession() {
  const [session, setSession] = useState<FocusSession>();
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<FocusSession | undefined>(undefined);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const tick = useCallback(() => {
    const current = sessionRef.current;
    setRemaining(current ? remainingSeconds(current) : 0);
  }, []);

  const load = useCallback(async () => {
    const stored = await repository.activeSession();
    setSession(stored);
    setRemaining(stored ? remainingSeconds(stored) : 0);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void load(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [load, tick]);

  const start = useCallback(async (taskId?: string | null) => {
    const started = await repository.startSession(taskId);
    setSession(started);
    setRemaining(remainingSeconds(started));
  }, []);

  const pause = useCallback(async () => {
    if (!sessionRef.current) return;
    setSession(await repository.pauseSession(sessionRef.current));
  }, []);

  const resume = useCallback(async () => {
    if (!sessionRef.current) return;
    const resumed = await repository.resumeSession(sessionRef.current);
    setSession(resumed);
    setRemaining(remainingSeconds(resumed));
  }, []);

  const cancel = useCallback(async () => {
    if (!sessionRef.current) return;
    await repository.cancelSession(sessionRef.current);
    setSession(undefined);
    setRemaining(0);
  }, []);

  const complete = useCallback(async () => {
    if (!sessionRef.current) return;
    await repository.completeSession(sessionRef.current);
    setSession(undefined);
    setRemaining(0);
    syncInBackground();
  }, []);

  return { session, remaining, loading, start, pause, resume, cancel, complete };
}
