import { useEffect } from 'react';
import { getDatabase } from '../../../db/client';
import { secureSession } from '../../../shared/storage/secure-session';
import { synchronize } from './sync-engine';

export function SyncStartup() {
  useEffect(() => {
    void (async () => {
      await getDatabase();
      if (await secureSession.getRefreshToken()) await synchronize().catch(() => undefined);
    })();
  }, []);
  return null;
}
