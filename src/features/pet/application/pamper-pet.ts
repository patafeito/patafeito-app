import { newId } from '../../../shared/utils/identifier';
import { syncInBackground } from '../../sync/application/sync-startup';
import { enqueueOperation } from '../../sync/infrastructure/sync-repository';
import { canPamper, minutesUntilPamper, petAfterPamper } from '../domain/stats';
import { loadLocalPet, saveLocalPet } from '../infrastructure/local-pet-repository';

export type PamperResult = { counted: boolean; minutesLeft: number };

/**
 * Carinho ao tocar no pato. Conta uma vez por hora: o efeito aparece na hora, mesmo offline,
 * e a operação vai para a fila. Toques dentro da hora só fazem o pato reagir.
 */
export async function pamperPet(now = new Date()): Promise<PamperResult> {
  const pet = await loadLocalPet();
  if (!pet) return { counted: false, minutesLeft: 0 };
  if (!canPamper(pet, now)) return { counted: false, minutesLeft: minutesUntilPamper(pet, now) };
  await saveLocalPet(petAfterPamper(pet, now));
  await enqueueOperation('pet.interact', { type: 'pamper' }, { resourceId: newId() });
  syncInBackground();
  return { counted: true, minutesLeft: 0 };
}
