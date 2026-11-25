import type { Pet } from './pet';

/** Espelho de `patafeito-api/src/modules/pets/domain/stats.ts`: mantenha as constantes iguais. */
export type PetStats = { hunger: number; energy: number; happiness: number };

/**
 * Dificuldade de cuidado de cada pato: quão rápido os status caem (`decay`, pontos por hora), quanto
 * cada cuidado rende (`gain`) e o peso das penalidades (`penalty`). Mesmos valores de `CARE_PROFILES`.
 */
export type CareDifficulty = 'easy' | 'medium' | 'hard';
type CareProfile = { decay: PetStats; gain: number; penalty: number };

const CARE_PROFILES: Record<CareDifficulty, CareProfile> = {
  easy: { decay: { hunger: 0.8, energy: 0.6, happiness: 0.8 }, gain: 1.5, penalty: 0.5 },
  medium: { decay: { hunger: 1.2, energy: 0.9, happiness: 1.2 }, gain: 1.25, penalty: 0.75 },
  hard: { decay: { hunger: 1.8, energy: 1.3, happiness: 1.8 }, gain: 1, penalty: 1 },
};

const SPECIES_DIFFICULTY: Record<string, CareDifficulty> = { pingo: 'easy', bento: 'medium', mare: 'hard' };

export const DIFFICULTY_LABEL: Record<CareDifficulty, string> = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };
export const DIFFICULTY_HINT: Record<CareDifficulty, string> = {
  easy: 'Pede pouco cuidado: os status caem devagar e cada cuidado rende 50% a mais.',
  medium: 'Pede cuidado moderado: os status caem em ritmo médio e cada cuidado rende 25% a mais.',
  hard: 'Pede bastante cuidado: os status caem mais rápido e os cuidados rendem o valor normal.',
};

export function careDifficulty(speciesId: string | null | undefined): CareDifficulty {
  return (speciesId && SPECIES_DIFFICULTY[speciesId]) || 'medium';
}

/** Quanto um cuidado positivo rende para este pato (como o servidor vai gravar). */
export function scaledGain(points: number, speciesId: string | null | undefined) {
  return points > 0 ? Math.round(points * CARE_PROFILES[careDifficulty(speciesId)].gain) : points;
}

const LOW_STAT_THRESHOLD = 30;
const LOW_STAT_PENALTY = 1.25;

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/** Projeta os status até `now` a partir do último valor gravado no servidor, sem rede. */
export function currentStats(pet: Pet, now = new Date()): PetStats {
  const energyBase = pet.energy ?? pet.health ?? 100;
  const updatedAt = pet.statsUpdatedAt ? new Date(pet.statsUpdatedAt).getTime() : now.getTime();
  const hours = Math.max(0, (now.getTime() - updatedAt) / 3_600_000);
  const decay = CARE_PROFILES[careDifficulty(pet.speciesId)].decay;
  const hunger = clamp(pet.hunger - decay.hunger * hours);
  const energy = clamp(energyBase - decay.energy * hours);
  const penalty = (hunger < LOW_STAT_THRESHOLD ? LOW_STAT_PENALTY : 1) * (energy < LOW_STAT_THRESHOLD ? LOW_STAT_PENALTY : 1);
  const happiness = clamp(pet.happiness - decay.happiness * penalty * hours);
  return { hunger, energy, happiness };
}

/**
 * Mimar (Tela 6): tocar no pato. Grátis, +5 de felicidade (ajustado à dificuldade do pato), conta no máximo uma vez por hora.
 * Espelho de `PAMPER_BOOST` e `canPamper` em `patafeito-api/src/modules/pets/domain/stats.ts`.
 * Alimentar e curar usam itens da mochila, comprados na loja.
 */
export const PAMPER_HAPPINESS = 5;
export const PAMPER_COOLDOWN_MS = 3_600_000;

/** Felicidade que o carinho dá a este pato. */
export function pamperHappiness(speciesId: string | null | undefined) {
  return scaledGain(PAMPER_HAPPINESS, speciesId);
}

export function canPamper(pet: Pick<Pet, 'lastPamperedAt'>, now = new Date()) {
  return !pet.lastPamperedAt || now.getTime() - new Date(pet.lastPamperedAt).getTime() >= PAMPER_COOLDOWN_MS;
}

/** Minutos até o próximo carinho contar (0 = já conta). */
export function minutesUntilPamper(pet: Pick<Pet, 'lastPamperedAt'>, now = new Date()) {
  if (canPamper(pet, now)) return 0;
  return Math.ceil((new Date(pet.lastPamperedAt!).getTime() + PAMPER_COOLDOWN_MS - now.getTime()) / 60_000);
}

/** Pet logo após o carinho: status projetados até agora mais o efeito, como o servidor vai gravar. */
export function petAfterPamper(pet: Pet, now = new Date()): Pet {
  const current = currentStats(pet, now);
  return { ...pet, ...current, happiness: clamp(current.happiness + pamperHappiness(pet.speciesId)), statsUpdatedAt: now.toISOString(), lastPamperedAt: now.toISOString() };
}
