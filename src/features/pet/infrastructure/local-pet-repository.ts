import { getDatabase } from '../../../db/client';
import type { Pet } from '../domain/pet';

type PetRow = { payload: string; version: number };

export async function loadLocalPet(): Promise<Pet | undefined> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<PetRow>('SELECT payload, version FROM local_pets LIMIT 1');
  if (!row) return undefined;
  return JSON.parse(row.payload) as Pet;
}

export async function saveLocalPet(pet: Pet) {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO local_pets (id, payload, version) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, version = excluded.version',
    pet.id, JSON.stringify(pet), pet.version,
  );
}
