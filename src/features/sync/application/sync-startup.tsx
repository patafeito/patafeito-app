import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getDatabase } from '../../../db/client';
import { authSession } from '../../../shared/network/auth-session';
import { synchronize } from './sync-engine';

export function SyncStartup() {
  const running = useRef(false);

  useEffect(() => {
    async function run() {
      if (running.current) return;
      running.current = true;
      try {
        await getDatabase();
        if (await authSession.hasSession()) await synchronize();
      } catch {
      } finally {
        running.current = false;
      }
    }

    void run();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void run(); });
    return () => subscription.remove();
  }, []);

  return null;
}

export function syncInBackground() {
  void synchronize().catch(() => undefined);
}
