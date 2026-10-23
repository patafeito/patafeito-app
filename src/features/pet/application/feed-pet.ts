import { newId } from '../../../shared/utils/identifier';
import { adjustCachedBalance, cachedBalance } from '../../rewards/infrastructure/balance-repository';
import { syncInBackground } from '../../sync/application/sync-startup';
import { enqueueOperation } from '../../sync/infrastructure/sync-repository';
import { FEED_BOOST, FEED_COST_COINS, withBoost } from '../domain/stats';
import type { Pet } from '../domain/pet';
import { saveLocalPet } from '../infrastructure/local-pet-repository';
import { celebrate } from './pet-mood';

export type FeedOutcome = { fed: boolean; message: string };

/** Alimenta já no aparelho e enfileira o débito. Se o servidor recusar, o sync restaura o pet. */
export async function feedPet(pet: Pet): Promise<FeedOutcome> {
  const balance = await cachedBalance();
  if (balance && balance.coins < FEED_COST_COINS) {
    return { fed: false, message: `Você precisa de ${FEED_COST_COINS} moedas para alimentar ${pet.name}.` };
  }
  await saveLocalPet(withBoost(pet, FEED_BOOST));
  await adjustCachedBalance(-FEED_COST_COINS);
  await enqueueOperation('pet.feed', {}, { resourceId: newId() });
  syncInBackground();
  celebrate('eating', { message: 'Nhac! Que delícia.' });
  return { fed: true, message: `${pet.name} comeu. -${FEED_COST_COINS} moedas, a confirmar.` };
}
