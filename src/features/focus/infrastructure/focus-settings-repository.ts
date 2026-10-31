import { localProfile } from '../../../shared/storage/local-profile';
import { CYCLE_STREAK_RESET_MS, defaultFocusSettings, nextBreak, normalizePreset, type FocusSettings, type NextBreak } from '../domain/focus-session';

const settingsKey = 'focus.settings';
const breakKey = 'focus.breakEndsAt';
const cyclesKey = 'focus.cyclesInRow';
const guardKey = 'focus.guard';

export async function loadFocusSettings(): Promise<FocusSettings> {
  const value = await localProfile.get(settingsKey);
  if (!value) return defaultFocusSettings;
  const stored = JSON.parse(value) as Partial<FocusSettings> & { preset?: string };
  return { ...defaultFocusSettings, ...stored, preset: normalizePreset(stored.preset) };
}

export async function saveFocusSettings(settings: FocusSettings) {
  await localProfile.set(settingsKey, JSON.stringify(settings));
}

/** Fim da pausa em andamento, guardado para sobreviver à troca de aba ou ao app fechado. */
export async function loadBreakEndsAt(): Promise<number | undefined> {
  const value = await localProfile.get(breakKey);
  return value ? Number(value) || undefined : undefined;
}

export async function saveBreakEndsAt(endsAt: number | null) {
  await localProfile.set(breakKey, endsAt === null ? '' : String(endsAt));
}

type CycleStreak = { count: number; lastAt: number };

/** Ciclos seguidos na série atual; zera depois da pausa longa ou de 2h sem ciclo. */
export async function loadCyclesInRow(now = Date.now()): Promise<number> {
  const value = await localProfile.get(cyclesKey);
  if (!value) return 0;
  const streak = JSON.parse(value) as CycleStreak;
  return now - streak.lastAt > CYCLE_STREAK_RESET_MS ? 0 : streak.count;
}

/** Conta o ciclo que acabou e devolve a pausa que vem agora (RN05). */
export async function advanceCycle(settings: FocusSettings, now = Date.now()): Promise<NextBreak & { cyclesInRow: number }> {
  const cyclesInRow = (await loadCyclesInRow(now)) + 1;
  const pause = nextBreak(settings, cyclesInRow);
  await localProfile.set(cyclesKey, JSON.stringify({ count: pause.long ? 0 : cyclesInRow, lastAt: now } satisfies CycleStreak));
  return { ...pause, cyclesInRow };
}

/**
 * Estado do modo anti-distração: qual sessão está protegida e quando a pessoa saiu do app.
 * Fica no armazenamento para valer mesmo se o sistema fechar o app em segundo plano.
 */
export type FocusGuard = { sessionId: string; leftAt?: number | null };

export async function loadFocusGuard(): Promise<FocusGuard | undefined> {
  const value = await localProfile.get(guardKey);
  return value ? JSON.parse(value) as FocusGuard : undefined;
}

export async function saveFocusGuard(guard: FocusGuard | null) {
  await localProfile.set(guardKey, guard ? JSON.stringify(guard) : '');
}
