import { authorizedFetch } from '../../../shared/network/authorized-fetch';
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
