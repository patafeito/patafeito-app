export const POMODORO_DURATION_SECONDS = 25 * 60;
export const POMODORO_BREAK_SECONDS = 5 * 60;

export type FocusSessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type FocusSession = {
  id: string;
  taskId?: string | null;
  mode?: FocusPresetId | null;
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

/** Modos do roteiro (RN05). O valor é o mesmo que a API grava em `focus_sessions.mode`. */
export type FocusPresetId = 'pomodoro' | 'deep_work' | 'sprint' | 'custom';
export type FocusSettings = { preset: FocusPresetId; focusMinutes: number; breakMinutes: number };

type FocusPreset = { label: string; description: string; focusMinutes: number; breakMinutes: number; longBreakMinutes: number; cyclesBeforeLongBreak: number };

export const focusPresets: Record<Exclude<FocusPresetId, 'custom'>, FocusPreset> = {
  pomodoro: { label: 'Pomodoro', description: '25 min de foco, 5 de pausa e pausa longa de 15 a cada 4 ciclos.', focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4 },
  deep_work: { label: 'Deep Work', description: '50 min de foco profundo, 10 de pausa e pausa longa de 20 a cada 2 ciclos.', focusMinutes: 50, breakMinutes: 10, longBreakMinutes: 20, cyclesBeforeLongBreak: 2 },
  sprint: { label: 'Sprint', description: '15 min de arrancada, 3 de pausa e pausa longa de 10 a cada 4 ciclos.', focusMinutes: 15, breakMinutes: 3, longBreakMinutes: 10, cyclesBeforeLongBreak: 4 },
};
export const defaultFocusSettings: FocusSettings = { preset: 'pomodoro', focusMinutes: 25, breakMinutes: 5 };

/** Ids gravados por versões anteriores do app. */
const legacyPresets: Record<string, FocusPresetId> = { classic: 'pomodoro', short: 'sprint', long: 'deep_work' };

export function normalizePreset(value: string | undefined): FocusPresetId {
  if (value && value in legacyPresets) return legacyPresets[value];
  return value === 'pomodoro' || value === 'deep_work' || value === 'sprint' || value === 'custom' ? value : 'pomodoro';
}

/** Depois de 2h sem ciclo, a série recomeça: a pausa longa é para ciclos seguidos. */
export const CYCLE_STREAK_RESET_MS = 2 * 3_600_000;

export type NextBreak = { seconds: number; long: boolean; cyclesBeforeLong?: number };

/**
 * Pausa depois do ciclo número `cyclesInRow` da série (RN05): a cada N ciclos, a pausa é longa.
 * O modo personalizado não tem pausa longa.
 */
export function nextBreak(settings: FocusSettings, cyclesInRow: number): NextBreak {
  if (settings.preset === 'custom') return { seconds: settings.breakMinutes * 60, long: false };
  const preset = focusPresets[settings.preset];
  const long = cyclesInRow > 0 && cyclesInRow % preset.cyclesBeforeLongBreak === 0;
  return { seconds: (long ? preset.longBreakMinutes : preset.breakMinutes) * 60, long, cyclesBeforeLong: preset.cyclesBeforeLongBreak };
}

/** "3/4 até a pausa longa": posição do próximo ciclo dentro da série. */
export function cycleProgress(settings: FocusSettings, cyclesInRow: number) {
  if (settings.preset === 'custom') return undefined;
  const total = focusPresets[settings.preset].cyclesBeforeLongBreak;
  return { current: (cyclesInRow % total) + 1, total };
}

/** Modo anti-distração: fora do app por mais que isto, o ciclo é interrompido e não rende XP (RN04). */
export const FOCUS_MODE_GRACE_MS = 60_000;
/** Aviso para voltar, mandado logo depois de sair do app no modo foco. */
export const FOCUS_MODE_NUDGE_MS = 10_000;

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

/** Espelho de `focusRewards` da API: 20 XP e 5 moedas a cada 25 minutos. */
export function focusRewards(durationSeconds: number) {
  const ratio = durationSeconds / POMODORO_DURATION_SECONDS;
  return { xp: Math.round(20 * ratio), coins: Math.round(5 * ratio) };
}
