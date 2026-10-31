import { Asset } from 'expo-asset';
import type { ImageSourcePropType } from 'react-native';
import manifest from '../../../../assets/pets/frames/manifest.json';
import type { SpeciesId } from '../../onboarding/domain/species';
import type { Pet } from './pet';

export type PetVisualState = 'idle' | 'blink' | 'happy' | 'cheer' | 'focus' | 'tired' | 'eating';

const sprites: Record<SpeciesId, Record<PetVisualState, ImageSourcePropType>> = {
  pingo: {
    idle: require('../../../../assets/pets/frames/pingo-idle.png') as ImageSourcePropType,
    blink: require('../../../../assets/pets/frames/pingo-blink.png') as ImageSourcePropType,
    happy: require('../../../../assets/pets/frames/pingo-happy.png') as ImageSourcePropType,
    cheer: require('../../../../assets/pets/frames/pingo-cheer.png') as ImageSourcePropType,
    focus: require('../../../../assets/pets/frames/pingo-focus.png') as ImageSourcePropType,
    tired: require('../../../../assets/pets/frames/pingo-tired.png') as ImageSourcePropType,
    eating: require('../../../../assets/pets/frames/pingo-eating.png') as ImageSourcePropType,
  },
  mare: {
    idle: require('../../../../assets/pets/frames/mare-idle.png') as ImageSourcePropType,
    blink: require('../../../../assets/pets/frames/mare-blink.png') as ImageSourcePropType,
    happy: require('../../../../assets/pets/frames/mare-happy.png') as ImageSourcePropType,
    cheer: require('../../../../assets/pets/frames/mare-cheer.png') as ImageSourcePropType,
    focus: require('../../../../assets/pets/frames/mare-focus.png') as ImageSourcePropType,
    tired: require('../../../../assets/pets/frames/mare-tired.png') as ImageSourcePropType,
    eating: require('../../../../assets/pets/frames/mare-eating.png') as ImageSourcePropType,
  },
  bento: {
    idle: require('../../../../assets/pets/frames/bento-idle.png') as ImageSourcePropType,
    blink: require('../../../../assets/pets/frames/bento-blink.png') as ImageSourcePropType,
    happy: require('../../../../assets/pets/frames/bento-happy.png') as ImageSourcePropType,
    cheer: require('../../../../assets/pets/frames/bento-cheer.png') as ImageSourcePropType,
    focus: require('../../../../assets/pets/frames/bento-focus.png') as ImageSourcePropType,
    tired: require('../../../../assets/pets/frames/bento-tired.png') as ImageSourcePropType,
    eating: require('../../../../assets/pets/frames/bento-eating.png') as ImageSourcePropType,
  },
};

export const petVisualStates: PetVisualState[] = ['idle', 'blink', 'happy', 'cheer', 'focus', 'tired', 'eating'];

export function petSprite(species: SpeciesId, state: PetVisualState) {
  return sprites[species][state];
}

const preloaded = new Map<SpeciesId, Promise<unknown>>();

export function preloadSpecies(species: SpeciesId) {
  if (!preloaded.has(species)) {
    preloaded.set(species, Asset.loadAsync(petVisualStates.map((state) => sprites[species][state] as number)).catch(() => undefined));
  }
  return preloaded.get(species)!;
}

export function spriteAspectRatio(species: SpeciesId) {
  const { width, height } = manifest[species];
  return width / height;
}

/** Abaixo disto o status está ruim e o pato fica cabisbaixo (mesmo limite de `LOW_STAT_THRESHOLD` da API). */
export const LOW_STAT = 30;

/**
 * Pose de repouso do pato. Qualquer status ruim (fome, energia ou felicidade) deixa o pato
 * cansado; a pose de comer fica só para a reação de quando ele é alimentado.
 */
export function moodFor(pet: Pick<Pet, 'hunger' | 'energy' | 'happiness'> | undefined): PetVisualState {
  if (!pet) return 'idle';
  if (Math.min(pet.hunger, pet.energy, pet.happiness) <= LOW_STAT) return 'tired';
  if (pet.happiness >= 80) return 'happy';
  return 'idle';
}
