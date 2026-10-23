import type { Pet } from './pet';

/** Espelho de `patafeito-api/src/modules/pets/domain/stats.ts`: mantenha as constantes iguais. */
export type PetStats = { hunger: number; energy: number; happiness: number };

const DECAY_PER_HOUR = { hunger: 4, energy: 2, happiness: 3 };
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

