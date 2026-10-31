import type { Pet } from './pet';

/** Espelho de `patafeito-api/src/modules/pets/domain/stats.ts`: mantenha as constantes iguais. */
export type PetStats = { hunger: number; energy: number; happiness: number };

const DECAY_PER_HOUR = { hunger: 2, energy: 1.5, happiness: 2 };
const LOW_STAT_THRESHOLD = 30;
const LOW_STAT_PENALTY = 1.5;

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/** Projeta os status até `now` a partir do último valor gravado no servidor, sem rede. */
export function currentStats(pet: Pet, now = new Date()): PetStats {
  const energyBase = pet.energy ?? pet.health ?? 100;
  const updatedAt = pet.statsUpdatedAt ? new Date(pet.statsUpdatedAt).getTime() : now.getTime();
  const hours = Math.max(0, (now.getTime() - updatedAt) / 3_600_000);
  const hunger = clamp(pet.hunger - DECAY_PER_HOUR.hunger * hours);
  const energy = clamp(energyBase - DECAY_PER_HOUR.energy * hours);
  const penalty = (hunger < LOW_STAT_THRESHOLD ? LOW_STAT_PENALTY : 1) * (energy < LOW_STAT_THRESHOLD ? LOW_STAT_PENALTY : 1);
  const happiness = clamp(pet.happiness - DECAY_PER_HOUR.happiness * penalty * hours);
  return { hunger, energy, happiness };
}

/**
 * Mimar (Tela 6): tocar no pato. Grátis, +5 de felicidade, conta no máximo uma vez por hora.
 * Espelho de `PAMPER_BOOST` e `canPamper` em `patafeito-api/src/modules/pets/domain/stats.ts`.
 * Alimentar e curar usam itens da mochila, comprados na loja.
 */
export const PAMPER_HAPPINESS = 5;
export const PAMPER_COOLDOWN_MS = 3_600_000;

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
  return { ...pet, ...current, happiness: clamp(current.happiness + PAMPER_HAPPINESS), statsUpdatedAt: now.toISOString(), lastPamperedAt: now.toISOString() };
}
