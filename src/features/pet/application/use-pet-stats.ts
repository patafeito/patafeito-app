import { useEffect, useState } from 'react';
import type { Pet } from '../domain/pet';
import { currentStats } from '../domain/stats';

const tickMs = 60_000;

/** Status do pet recalculados a cada minuto, para as barras caírem com a tela aberta. */
export function usePetStats(pet: Pet) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(timer);
  }, []);
  return currentStats(pet, now);
}
