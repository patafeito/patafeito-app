import { secureSession } from '../storage/secure-session';
import { ApiError, apiFetch } from './api-client';

export type Tokens = { accessToken: string; refreshToken: string };

let cachedAccessToken: string | null = null;
let refreshInFlight: Promise<string> | null = null;
const listeners = new Set<(signedIn: boolean) => void>();

function notify(signedIn: boolean) {
  for (const listener of listeners) listener(signedIn);
}

export const authSession = {
  subscribe(listener: (signedIn: boolean) => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },

  async start(tokens: Tokens) {
    cachedAccessToken = tokens.accessToken;
    await Promise.all([secureSession.saveAccessToken(tokens.accessToken), secureSession.saveRefreshToken(tokens.refreshToken)]);
    notify(true);
  },

  async hasSession() {
    return (await secureSession.getRefreshToken()) !== null;
  },

  async getAccessToken() {
    cachedAccessToken ??= await secureSession.getAccessToken();
    return cachedAccessToken;
  },

  refresh(): Promise<string> {
    refreshInFlight ??= (async () => {
      try {
        const refreshToken = await secureSession.getRefreshToken();
        if (!refreshToken) throw new ApiError(401, 'Sessão não disponível.');
        const response = await apiFetch<{ tokens: Tokens }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
        cachedAccessToken = response.tokens.accessToken;
        await Promise.all([secureSession.saveAccessToken(response.tokens.accessToken), secureSession.saveRefreshToken(response.tokens.refreshToken)]);
        return response.tokens.accessToken;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await authSession.clear();
        throw error;
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  },

  async clear() {
    cachedAccessToken = null;
    await Promise.all([secureSession.clear(), secureSession.clearAccessToken()]);
    notify(false);
  },
};
