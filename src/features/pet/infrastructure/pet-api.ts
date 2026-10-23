import { authorizedFetch } from '../../../shared/network/authorized-fetch';
import type { Period } from '../domain/companions';
import type { Pet } from '../domain/pet';
import { saveLocalPet } from './local-pet-repository';

export async function createPet(input: { speciesId: string; name: string }) {
  const pet = await authorizedFetch<Pet>('/pets/me', { method: 'POST', body: JSON.stringify(input) });
  await saveLocalPet(pet);
  return pet;
}

export async function fetchPet() {
  const pet = await authorizedFetch<Pet>('/pets/me');
  await saveLocalPet(pet);
  return pet;
}

export async function renamePet(name: string) {
  const pet = await authorizedFetch<Pet>('/pets/me', { method: 'PATCH', body: JSON.stringify({ name }) });
  await saveLocalPet(pet);
  return pet;
}

/** Troca a espécie; XP, nível e status seguem com o novo pato. */
export async function switchPet(input: { speciesId: string; name: string }) {
  const pet = await authorizedFetch<Pet>('/pets/me/switch', { method: 'POST', body: JSON.stringify(input) });
  await saveLocalPet(pet);
  return pet;
}

export async function fetchPetHistory() {
  return authorizedFetch<Period[]>('/pets/me/history');
}
