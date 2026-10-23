import { getDatabase } from '../../../db/client';
import { authorizedFetch } from '../../../shared/network/authorized-fetch';
import { localProfile } from '../../../shared/storage/local-profile';
import { newId } from '../../../shared/utils/identifier';
import type { Pet } from '../../pet/domain/pet';
import { saveLocalPet } from '../../pet/infrastructure/local-pet-repository';
import { setCachedCoins } from '../../rewards/infrastructure/balance-repository';
import type { Boosts, InventoryRow, ShopItem } from '../domain/catalog';

const catalogKey = 'shop.catalog';
const boostsKey = 'shop.boosts';

async function cached<T>(key: string): Promise<T | undefined> {
  const value = await localProfile.get(key);
  return value ? JSON.parse(value) as T : undefined;
}

export async function cachedCatalog() {
  return (await cached<ShopItem[]>(catalogKey)) ?? [];
}

export async function cachedBoosts(): Promise<Boosts> {
  return (await cached<Boosts>(boostsKey)) ?? { active: [], protectedDates: [] };
}

export async function refreshCatalog() {
  const items = await authorizedFetch<ShopItem[]>('/shop/items');
  await localProfile.set(catalogKey, JSON.stringify(items));
  return items;
}

export async function refreshBoosts() {
  const boosts = await authorizedFetch<Boosts>('/inventory/boosts');
  await localProfile.set(boostsKey, JSON.stringify(boosts));
  return boosts;
}

/** Mesma tabela que o sync preenche: o inventário local vale também sem rede. */
export async function listLocalInventory(): Promise<InventoryRow[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ payload: string }>('SELECT payload FROM local_inventory');
  // Linhas gravadas antes da coluna `quantity` existir valem uma unidade.
  return rows.map((row) => {
    const parsed = JSON.parse(row.payload) as Omit<InventoryRow, 'quantity'> & { quantity?: number };
    return { ...parsed, quantity: parsed.quantity ?? 1 };
  });
}

async function saveLocalInventory(rows: InventoryRow[]) {
  const database = await getDatabase();
  for (const row of rows) {
    await database.runAsync(
      'INSERT INTO local_inventory (id, payload, version) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, version = excluded.version',
      row.id, JSON.stringify(row), row.acquiredAt,
    );
  }
}

export async function refreshInventory() {
  const rows = await authorizedFetch<{ inventory: InventoryRow }[]>('/inventory');
  await saveLocalInventory(rows.map((row) => row.inventory));
}

export async function purchase(itemId: string) {
  const result = await authorizedFetch<{ inventoryItem: InventoryRow; balanceCoins: number }>('/shop/purchases', {
    method: 'POST', headers: { 'idempotency-key': newId() }, body: JSON.stringify({ itemId }),
  });
  await saveLocalInventory([result.inventoryItem]);
  await setCachedCoins(result.balanceCoins);
  return result;
}

export async function consumeItem(itemId: string, localDate?: string) {
  const result = await authorizedFetch<{ inventoryItem: InventoryRow; pet: Pet | null }>('/inventory/use', {
    method: 'POST', headers: { 'idempotency-key': newId() }, body: JSON.stringify({ itemId, localDate }),
  });
  await saveLocalInventory([result.inventoryItem]);
  if (result.pet) await saveLocalPet(result.pet);
  await refreshBoosts().catch(() => undefined);
  return result;
}

export async function setEquipped(itemId: string, equipped: boolean) {
  await authorizedFetch<InventoryRow>('/inventory', { method: 'PATCH', body: JSON.stringify({ itemId, equipped }) });
  // Equipar um tira o outro da mesma categoria: relê tudo para refletir os dois.
  await refreshInventory();
}

/** Sku do cenário equipado, a partir do inventário local e do catálogo em cache. */
export async function equippedBackgroundSku() {
  const [inventory, catalog] = await Promise.all([listLocalInventory(), cachedCatalog()]);
  const backgrounds = new Map(catalog.filter((item) => item.slot === 'background').map((item) => [item.id, item.sku]));
  return inventory.map((row) => (row.equipped ? backgrounds.get(row.itemId) : undefined)).find(Boolean);
}

