import type { Pet } from './pet';

/** Espelho de `patafeito-api/src/modules/pets/domain/stats.ts`: mantenha as constantes iguais. */
export type PetStats = { hunger: number; energy: number; happiness: number };

const DECAY_PER_HOUR = { hunger: 4, energy: 2, happiness: 3 };
const LOW_STAT_THRESHOLD = 30;
const LOW_STAT_PENALTY = 1.5;

export const FEED_COST_COINS = 5;
export const FEED_BOOST: PetStats = { hunger: 35, energy: 0, happiness: 2 };

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

/** Cópia local do pet com os status projetados até `now` e somados ao bônus. */
export function withBoost(pet: Pet, boost: PetStats, now = new Date()): Pet {
  const stats = currentStats(pet, now);
  return {
    ...pet,
    hunger: clamp(stats.hunger + boost.hunger),
    energy: clamp(stats.energy + boost.energy),
    happiness: clamp(stats.happiness + boost.happiness),
    statsUpdatedAt: now.toISOString(),
  };
}
