import { ApiError, apiFetch } from './api-client';
import { authSession } from './auth-session';

function withAuthorization(init: RequestInit | undefined, accessToken: string): RequestInit {
  return { ...init, headers: { ...init?.headers, authorization: `Bearer ${accessToken}` } };
}

export async function authorizedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = (await authSession.getAccessToken()) ?? (await authSession.refresh());
  try {
    return await apiFetch<T>(path, withAuthorization(init, accessToken));
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    return apiFetch<T>(path, withAuthorization(init, await authSession.refresh()));
  }
}
