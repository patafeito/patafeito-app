import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { resetDatabase } from '../../../db/client';
import { authSession } from '../../../shared/network/auth-session';
import * as authApi from '../infrastructure/auth-api';
import type { SessionStatus, User } from '../domain/session';

type SessionContextValue = {
  status: SessionStatus;
  user?: User;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: { email: string; password: string; displayName: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<User>();

  useEffect(() => {
    void (async () => {
      const signedIn = await authSession.hasSession();
      if (signedIn) setUser(await authApi.storedUser());
      setStatus(signedIn ? 'signed-in' : 'signed-out');
    })();
    return authSession.subscribe((signedIn) => {
      if (!signedIn) { setUser(undefined); setStatus('signed-out'); }
    });
  }, []);

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    setUser(await authApi.login(input));
    setStatus('signed-in');
  }, []);

  const signUp = useCallback(async (input: { email: string; password: string; displayName: string }) => {
    setUser(await authApi.register(input));
    setStatus('signed-in');
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    await resetDatabase();
    setUser(undefined);
    setStatus('signed-out');
  }, []);

  const value = useMemo(() => ({ status, user, signIn, signUp, signOut }), [status, user, signIn, signUp, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession precisa estar dentro de SessionProvider.');
  return context;
}
