import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getDatabase } from '../../../db/client';
import { authSession } from '../../../shared/network/auth-session';
import { synchronize } from './sync-engine';

/** Com o app aberto, busca novidades do servidor (alertas das rotinas) a cada 2 minutos (RNF09). */
const FOREGROUND_PULL_MS = 2 * 60_000;

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
    const timer = setInterval(() => { if (AppState.currentState === 'active') void run(); }, FOREGROUND_PULL_MS);
    return () => { subscription.remove(); clearInterval(timer); };
  }, []);

  return null;
}

export function syncInBackground() {
  void synchronize().catch(() => undefined);
}
