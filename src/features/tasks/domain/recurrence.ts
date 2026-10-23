export type Recurrence = 'daily' | 'weekly' | 'monthly';
export type RecurrenceRule = { recurrence: Recurrence; recurrenceDay: number | null };

export const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const everyWeekday = ['Todo domingo', 'Toda segunda', 'Toda terça', 'Toda quarta', 'Toda quinta', 'Toda sexta', 'Todo sábado'];

export function recurrenceLabel(rule: RecurrenceRule) {
  if (rule.recurrence === 'daily') return 'Todo dia';
  if (rule.recurrence === 'weekly') return everyWeekday[rule.recurrenceDay ?? 0];
  return `Todo dia ${rule.recurrenceDay}`;
}

/** Dia do mês digitado pelo usuário: inteiro de 1 a 31, ou `undefined` se inválido. */
export function parseMonthDay(text: string): number | undefined {
  const value = text.trim();
  if (!/^\d{1,2}$/.test(value)) return undefined;
  const day = Number(value);
  return day >= 1 && day <= 31 ? day : undefined;
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Mensal no dia 31 cai no último dia dos meses mais curtos. */
export function occursOn(rule: RecurrenceRule, date: Date) {
  if (rule.recurrence === 'daily') return true;
  if (rule.recurrence === 'weekly') return date.getDay() === rule.recurrenceDay;
  return date.getDate() === Math.min(rule.recurrenceDay ?? 1, daysInMonth(date));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Próxima data da série depois de `after` (exclusive) e não antes de `from` (inclusive).
 * Repetições perdidas não são recriadas: a série segue a partir de hoje. O prazo é 23:59 do dia.
 */
export function nextOccurrence(rule: RecurrenceRule, after: Date | null, from: Date): Date {
  const cursor = startOfDay(from);
  if (after) {
    const dayAfter = startOfDay(after);
    dayAfter.setDate(dayAfter.getDate() + 1);
    if (dayAfter > cursor) cursor.setTime(dayAfter.getTime());
  }
  while (!occursOn(rule, cursor)) cursor.setDate(cursor.getDate() + 1);
  cursor.setHours(23, 59, 0, 0);
  return cursor;
}

/** Chave do dia local, usada no id determinístico de cada repetição. */
export function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
