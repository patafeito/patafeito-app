const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api/v1';

export class ApiError extends Error { constructor(public readonly status: number, message: string) { super(message); } }

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
  const body = await response.json();
  if (!response.ok) throw new ApiError(response.status, body.error?.message ?? 'Não foi possível concluir esta ação.');
  return body.data as T;
}

export function authenticatedApiFetch<T>(path: string, accessToken: string, init?: RequestInit) {
  return apiFetch<T>(path, { ...init, headers: { ...init?.headers, authorization: `Bearer ${accessToken}` } });
}
