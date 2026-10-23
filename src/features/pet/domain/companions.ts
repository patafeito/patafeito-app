export type Period = { speciesId: string; name: string; startedAt: string; endedAt: string | null };
export type CompanionSummary = { speciesId: string; lastName: string; totalMs: number; current: boolean; periods: number };

/** Soma o tempo com cada espécie; o período em aberto conta até `now`. Ordena do mais tempo ao menos. */
export function summarizeCompanions(periods: Period[], now = new Date()): CompanionSummary[] {
  const bySpecies = new Map<string, CompanionSummary>();
  for (const period of periods) {
    const end = period.endedAt ? new Date(period.endedAt).getTime() : now.getTime();
    const duration = Math.max(0, end - new Date(period.startedAt).getTime());
    const summary = bySpecies.get(period.speciesId) ?? { speciesId: period.speciesId, lastName: period.name, totalMs: 0, current: false, periods: 0 };
    summary.totalMs += duration;
    summary.periods += 1;
    summary.lastName = period.name;
    summary.current ||= period.endedAt === null;
    bySpecies.set(period.speciesId, summary);
  }
  return [...bySpecies.values()].sort((a, b) => b.totalMs - a.totalMs);
}

const hourMs = 3_600_000;
const dayMs = 24 * hourMs;

export function formatCompanionTime(ms: number) {
  if (ms < hourMs) return 'menos de 1 hora';
  const days = Math.floor(ms / dayMs);
  const hours = Math.floor((ms % dayMs) / hourMs);
  const dayText = days ? `${days} ${days === 1 ? 'dia' : 'dias'}` : '';
  const hourText = hours ? `${hours} ${hours === 1 ? 'hora' : 'horas'}` : '';
  return [dayText, hourText].filter(Boolean).join(' e ');
}
