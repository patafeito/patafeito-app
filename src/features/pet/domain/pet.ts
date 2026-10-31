/** `hunger` é saciedade (100 = alimentado). `health` só existe em cópias locais anteriores ao campo `energy`. */
export type Pet = {
  id: string; speciesId: string; name: string; level: number; xpTotal: number;
  hunger: number; energy: number; happiness: number; statsUpdatedAt: string; version: number; health?: number;
  /** RN02 e RN11, vindos do servidor; cópias locais antigas não têm. */
  overdueStreak?: number; lastActivityAt?: string | null; createdAt?: string;
  /** Último carinho que contou (Mimar). */
  lastPamperedAt?: string | null;
};
