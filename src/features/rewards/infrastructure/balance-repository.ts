import { authorizedFetch } from '../../../shared/network/authorized-fetch';
import { localProfile } from '../../../shared/storage/local-profile';

export type Balance = { coins: number; xpTotal: number };

const balanceKey = 'rewards.balance';

export async function cachedBalance(): Promise<Balance | undefined> {
  const value = await localProfile.get(balanceKey);
  return value ? JSON.parse(value) as Balance : undefined;
}

export async function refreshBalance(): Promise<Balance> {
  const balance = await authorizedFetch<Balance>('/rewards/balance');
  await localProfile.set(balanceKey, JSON.stringify(balance));
  return balance;
}

/** Grava o saldo de moedas que o servidor acabou de informar. */
export async function setCachedCoins(coins: number) {
  const balance = await cachedBalance();
  await localProfile.set(balanceKey, JSON.stringify({ xpTotal: balance?.xpTotal ?? 0, coins }));
}
