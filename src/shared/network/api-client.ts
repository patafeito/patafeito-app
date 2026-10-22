import Constants from 'expo-constants';
import { Platform } from 'react-native';

const port = process.env.EXPO_PUBLIC_API_PORT ?? '3000';
const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

function candidateOrigins() {
  const metroHost = Constants.expoConfig?.hostUri?.split('/')[0]?.split(':')[0];
  const hosts = [metroHost, 'localhost', Platform.OS === 'android' ? '10.0.2.2' : undefined];
  return [...new Set(hosts.filter((host): host is string => !!host))].map((host) => `http://${host}:${port}`);
}

async function responds(origin: string, timeoutMs = 2000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${origin}/health`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

let resolution: Promise<string> | undefined;
let resolved: string | undefined;

export function apiBaseUrl() {
  return resolved ?? configuredUrl ?? `${candidateOrigins()[0]}/api/v1`;
}

async function resolveBaseUrl() {
  if (configuredUrl) return configuredUrl;
  const origins = candidateOrigins();
  for (const origin of origins) {
    if (await responds(origin)) return `${origin}/api/v1`;
  }
  return `${origins[0]}/api/v1`;
}

export async function baseUrl() {
  resolution ??= resolveBaseUrl().then((url) => { resolved = url; return url; });
  return resolution;
}

export function forgetBaseUrl() {
  resolution = undefined;
  resolved = undefined;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string) { super(message); }
}

export class NetworkError extends Error {
  constructor(address: string) {
    super(__DEV__ ? `Sem conexão com o servidor (${address}).` : 'Sem conexão com o servidor.');
  }
}

const requestTimeoutMs = 15_000;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const address = await baseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  let response: Response;
  try {
    response = await fetch(`${address}${path}`, { signal: controller.signal, ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
  } catch {
    forgetBaseUrl();
    throw new NetworkError(address);
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => undefined) as { data?: unknown; error?: { message?: string; code?: string } } | undefined;
  if (!response.ok) throw new ApiError(response.status, body?.error?.message ?? 'Não foi possível concluir esta ação.', body?.error?.code);
  return body?.data as T;
}
