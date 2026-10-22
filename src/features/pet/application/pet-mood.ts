import { useSyncExternalStore } from 'react';
import type { PetVisualState } from '../domain/pet-sprites';

type Reaction = { state: PetVisualState; message?: string; id: number };

let reaction: Reaction | undefined;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function celebrate(state: PetVisualState = 'cheer', options?: { message?: string; durationMs?: number }) {
  const durationMs = options?.durationMs ?? 3600;
  reaction = { state, message: options?.message, id: nextId += 1 };
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => { reaction = undefined; emit(); }, durationMs);
}

export function clearReaction() {
  clearTimeout(timer);
  reaction = undefined;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function snapshot() {
  return reaction;
}

export function usePetReaction() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
