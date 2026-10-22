import { resetDatabase } from '../../../db/client';
import { apiFetch } from '../../../shared/network/api-client';
import { authSession, type Tokens } from '../../../shared/network/auth-session';
import { secureSession } from '../../../shared/storage/secure-session';
import { localProfile } from '../../../shared/storage/local-profile';
import type { User } from '../domain/session';

type AuthResponse = { user: User; tokens: Tokens };
const userKey = 'auth.user';

async function persist(response: AuthResponse) {
  const previous = await storedUser();
  if (previous && previous.id !== response.user.id) await resetDatabase();
  await authSession.start(response.tokens);
  await localProfile.set(userKey, JSON.stringify(response.user));
  return response.user;
}

export async function register(input: { email: string; password: string; displayName: string }) {
  return persist(await apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) }));
}

export async function login(input: { email: string; password: string }) {
  return persist(await apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }));
}

export async function logout() {
  const refreshToken = await secureSession.getRefreshToken();
  if (refreshToken) await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => undefined);
  await authSession.clear();
}

export async function storedUser(): Promise<User | undefined> {
  const value = await localProfile.get(userKey);
  return value ? JSON.parse(value) as User : undefined;
}
