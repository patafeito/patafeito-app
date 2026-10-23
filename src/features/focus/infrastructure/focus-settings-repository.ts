import { localProfile } from '../../../shared/storage/local-profile';
import { defaultFocusSettings, type FocusSettings } from '../domain/focus-session';

const settingsKey = 'focus.settings';
const breakKey = 'focus.breakEndsAt';

export async function loadFocusSettings(): Promise<FocusSettings> {
  const value = await localProfile.get(settingsKey);
  return value ? { ...defaultFocusSettings, ...(JSON.parse(value) as Partial<FocusSettings>) } : defaultFocusSettings;
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
