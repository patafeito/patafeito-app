export const POMODORO_DURATION_SECONDS = 25 * 60;
export const POMODORO_BREAK_SECONDS = 5 * 60;

export type FocusSessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type FocusSession = {
  id: string;
  taskId?: string | null;
  startedAt: string;
  durationSeconds: number;
  status: FocusSessionStatus;
  finishedAt?: string | null;
  pausedAt?: string | null;
};

export function remainingSeconds(session: FocusSession, now = Date.now()): number {
  const reference = session.status === 'paused' && session.pausedAt ? new Date(session.pausedAt).getTime() : now;
  const elapsed = reference - new Date(session.startedAt).getTime();
  return Math.max(0, Math.ceil(session.durationSeconds - elapsed / 1000));
}

export function isComplete(session: FocusSession, now = Date.now()) {
  return remainingSeconds(session, now) === 0;
}

export function formatRemaining(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export type FocusPresetId = 'classic' | 'short' | 'long' | 'custom';
export type FocusSettings = { preset: FocusPresetId; focusMinutes: number; breakMinutes: number };

export const focusPresets: Record<Exclude<FocusPresetId, 'custom'>, { label: string; focusMinutes: number; breakMinutes: number }> = {
  classic: { label: 'Clássica', focusMinutes: 25, breakMinutes: 5 },
  short: { label: 'Curta', focusMinutes: 15, breakMinutes: 3 },
  long: { label: 'Longa', focusMinutes: 50, breakMinutes: 10 },
};
export const defaultFocusSettings: FocusSettings = { preset: 'classic', focusMinutes: 25, breakMinutes: 5 };

/** Limites do ciclo personalizado; o servidor aceita foco de 5 a 120 minutos. */
export const FOCUS_MINUTES_RANGE = { min: 5, max: 120 };
export const BREAK_MINUTES_RANGE = { min: 1, max: 60 };

/** Minutos digitados pelo usuário: inteiro dentro do intervalo, ou `undefined` se inválido. */
export function parseMinutes(text: string, range: { min: number; max: number }): number | undefined {
  const value = text.trim();
  if (!/^\d{1,3}$/.test(value)) return undefined;
  const minutes = Number(value);
  return minutes >= range.min && minutes <= range.max ? minutes : undefined;
}

/** Espelho de `focusRewards` da API: 20 XP e 4 moedas a cada 25 minutos. */
export function focusRewards(durationSeconds: number) {
  const ratio = durationSeconds / POMODORO_DURATION_SECONDS;
  return { xp: Math.round(20 * ratio), coins: Math.round(4 * ratio) };
}
