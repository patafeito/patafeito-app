import { focusRewards, type FocusSession } from '../../focus/domain/focus-session';
import type { Pet } from '../../pet/domain/pet';
import { currentStats, type PetStats } from '../../pet/domain/stats';
import { dayKey, occursOn, type RecurrenceRule } from '../../tasks/domain/recurrence';
import { currentStreak, type Task } from '../../tasks/domain/task';

export type NotificationCategory = 'focus' | 'tasks' | 'streak' | 'pet';
export type NotificationPreferences = Record<NotificationCategory, boolean>;
export const defaultNotificationPreferences: NotificationPreferences = { focus: true, tasks: true, streak: true, pet: true };

/** Canais do Android: o foco toca alto; lembretes e pato são discretos. */
export type NotificationChannel = 'focus' | 'reminders' | 'pet';

export type PlannedNotification = {
  id: string;
  channel: NotificationChannel;
  date: Date;
  title: string;
  body: string;
  /** Rota aberta ao tocar na notificação. */
  url: string;
};

export type PlannerInput = {
  now: Date;
  preferences: NotificationPreferences;
  pet?: Pet;
  /** Todas as tarefas locais (pendentes e concluídas), sem as excluídas. */
  tasks: Task[];
  completionDates: string[];
  protectedDates: string[];
  focus?: FocusSession;
  breakEndsAt?: number;
};

const MORNING_HOUR = 9;
const EVENING_HOUR = 20;
/** Fora do foco, nada toca entre 22h e 8h: o aviso espera a manhã. */
const QUIET_START_HOUR = 22;
const QUIET_END_HOUR = 8;
const MORNING_DAYS = 7;
const EVENING_DAYS = 3;
const LOW_STAT = 30;
/** Se o status já está baixo ao sair do app, lembra depois de um tempo em vez de na hora. */
const ALREADY_LOW_DELAY_HOURS = 3;
const MISSING_YOU_HOURS = 48;
const STAT_STEP_MINUTES = 10;
const STAT_HORIZON_HOURS = 72;

function atHour(base: Date, dayOffset: number, hour: number) {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** Empurra para as 8h um aviso que cairia no horário silencioso. */
export function outsideQuietHours(date: Date) {
  const hour = date.getHours();
  if (hour >= QUIET_START_HOUR) return atHour(date, 1, QUIET_END_HOUR);
  if (hour < QUIET_END_HOUR) return atHour(date, 0, QUIET_END_HOUR);
  return date;
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Tarefas previstas para um dia: as que vencem nele e, de dias futuros, as repetições de hábitos
 * que ainda não foram criadas (o app só gera a próxima de cada série).
 */
function pendingOn(day: Date, tasks: Task[], now: Date) {
  const due = tasks.filter((task) => task.status === 'pending' && task.dueAt && sameDay(new Date(task.dueAt), day));
  if (sameDay(day, now)) return due.map((task) => task.title);
  const series = new Map<string, { title: string; rule: RecurrenceRule; dueAt: string }>();
  for (const task of tasks) {
    if (!task.seriesId || !task.recurrence || !task.dueAt) continue;
    const known = series.get(task.seriesId);
    if (!known || known.dueAt < task.dueAt) series.set(task.seriesId, { title: task.title, rule: { recurrence: task.recurrence, recurrenceDay: task.recurrenceDay ?? null }, dueAt: task.dueAt });
  }
  // Uma série some quando a última repetição é excluída; só contam as que ainda têm uma pendente.
  const activeSeries = new Set(tasks.filter((task) => task.seriesId && task.status === 'pending').map((task) => task.seriesId!));
  const titles = due.map((task) => task.title);
  const dueSeries = new Set(due.map((task) => task.seriesId).filter(Boolean));
  for (const [seriesId, item] of series) {
    if (activeSeries.has(seriesId) && !dueSeries.has(seriesId) && new Date(item.dueAt) < day && occursOn(item.rule, day)) titles.push(item.title);
  }
  return titles;
}

function focusNotifications({ now, focus, breakEndsAt, pet }: PlannerInput): PlannedNotification[] {
  const planned: PlannedNotification[] = [];
  const name = pet?.name ?? 'Seu pato';
  if (focus?.status === 'active') {
    const endsAt = new Date(new Date(focus.startedAt).getTime() + focus.durationSeconds * 1000);
    const reward = focusRewards(focus.durationSeconds);
    if (endsAt > now) planned.push({
      id: 'focus-end', channel: 'focus', date: endsAt, url: '/(tabs)/focus',
      title: 'Ciclo de foco concluído!',
      body: `${name} ficou com você até o fim. Abra para registrar e ganhar ${reward.xp} XP.`,
    });
  }
  if (!focus && breakEndsAt && breakEndsAt > now.getTime()) planned.push({
    id: 'break-end', channel: 'focus', date: new Date(breakEndsAt), url: '/(tabs)/focus',
    title: 'Fim da pausa',
    body: 'Bora para o próximo ciclo? Um passo de cada vez.',
  });
  return planned;
}

function morningNotifications({ now, tasks }: PlannerInput): PlannedNotification[] {
  const planned: PlannedNotification[] = [];
  for (let offset = 0; offset < MORNING_DAYS; offset += 1) {
    const date = atHour(now, offset, MORNING_HOUR);
    if (date <= now) continue;
    const titles = pendingOn(date, tasks, now);
    if (!titles.length) continue;
    planned.push({
      id: `morning:${dayKey(date)}`, channel: 'reminders', date, url: '/(tabs)/tasks',
      title: `Bom dia! ${plural(titles.length, 'tarefa', 'tarefas')} para hoje`,
      body: titles.length === 1 ? `“${titles[0]}” está esperando por você.` : `Comece por “${titles[0]}” e o resto fica mais leve.`,
    });
  }
  return planned;
}

/**
 * Um aviso por noite, no máximo: sequência em risco tem prioridade; senão, tarefas que vencem no dia.
 * Hoje usa o que já se sabe; amanhã supõe que a sequência sobreviveu só se hoje já conta.
 */
function eveningNotifications(input: PlannerInput): PlannedNotification[] {
  const { now, tasks, completionDates, protectedDates, preferences } = input;
  const today = dayKey(now);
  const doneToday = completionDates.some((value) => sameDay(new Date(value), now)) || protectedDates.includes(today);
  const streak = currentStreak(completionDates, now, protectedDates);
  const planned: PlannedNotification[] = [];
  for (let offset = 0; offset < EVENING_DAYS; offset += 1) {
    const date = atHour(now, offset, EVENING_HOUR);
    if (date <= now) continue;
    const titles = pendingOn(date, tasks, now);
    const streakAtRisk = preferences.streak && streak > 0 && (offset === 0 ? !doneToday : offset === 1 && doneToday);
    if (streakAtRisk) {
      planned.push({
        id: `evening:${dayKey(date)}`, channel: 'reminders', date, url: '/(tabs)/tasks',
        title: `Sua sequência de ${plural(streak, 'dia', 'dias')} está em risco`,
        body: titles.length ? `Conclua “${titles[0]}” até a meia-noite para manter a chama acesa.` : 'Conclua qualquer tarefa até a meia-noite para manter a chama acesa.',
      });
    } else if (preferences.tasks && titles.length) {
      planned.push({
        id: `evening:${dayKey(date)}`, channel: 'reminders', date, url: '/(tabs)/tasks',
        title: `Ainda ${titles.length === 1 ? 'falta 1 tarefa' : `faltam ${titles.length} tarefas`} de hoje`,
        body: titles.length === 1 ? `“${titles[0]}” vence à meia-noite.` : `“${titles[0]}” e mais ${titles.length - 1} vencem à meia-noite.`,
      });
    }
  }
  return planned;
}

const statMessages: Record<keyof PetStats, (name: string) => { title: string; body: string; url: string }> = {
  hunger: (name) => ({ title: `${name} está com fome`, body: 'Que tal um lanchinho? Bem alimentado, ele fica mais feliz.', url: '/(tabs)/pet' }),
  energy: (name) => ({ title: `${name} está sem energia`, body: 'Um ciclo de foco juntos recarrega as baterias dele.', url: '/(tabs)/focus' }),
  happiness: (name) => ({ title: `${name} está tristinho`, body: 'Concluir uma tarefa deixa ele animado de novo.', url: '/(tabs)/tasks' }),
};

/** Projeta os status com o mesmo decaimento do servidor e avisa quando cada um ficar baixo. */
function petNotifications({ now, pet }: PlannerInput): PlannedNotification[] {
  if (!pet) return [];
  const planned: PlannedNotification[] = [];
  const start = currentStats(pet, now);
  for (const stat of Object.keys(statMessages) as (keyof PetStats)[]) {
    let date: Date | undefined;
    if (start[stat] < LOW_STAT) date = new Date(now.getTime() + ALREADY_LOW_DELAY_HOURS * 3_600_000);
    else {
      for (let minutes = STAT_STEP_MINUTES; minutes <= STAT_HORIZON_HOURS * 60; minutes += STAT_STEP_MINUTES) {
        const at = new Date(now.getTime() + minutes * 60_000);
        if (currentStats(pet, at)[stat] < LOW_STAT) { date = at; break; }
      }
    }
    if (date) planned.push({ id: `pet:${stat}`, channel: 'pet', date: outsideQuietHours(date), ...statMessages[stat](pet.name) });
  }
  planned.push({
    id: 'pet:missing-you', channel: 'pet', url: '/(tabs)',
    date: outsideQuietHours(new Date(now.getTime() + MISSING_YOU_HOURS * 3_600_000)),
    title: `${pet.name} sente sua falta`,
    body: 'O lago ficou quieto sem você. Volte para ver como ele está.',
  });
  return planned;
}

/**
 * Lista completa de avisos locais a partir do estado do aparelho. É recalculada toda vez que o app
 * abre ou vai para o fundo, então pode supor que nada muda até lá: o que mudar é replanejado.
 */
export function planNotifications(input: PlannerInput): PlannedNotification[] {
  const { preferences } = input;
  const planned = [
    ...(preferences.focus ? focusNotifications(input) : []),
    ...(preferences.tasks ? morningNotifications(input) : []),
    ...(preferences.tasks || preferences.streak ? eveningNotifications(input) : []),
    ...(preferences.pet ? petNotifications(input) : []),
  ];
  return planned.filter((item) => item.date > input.now).sort((a, b) => a.date.getTime() - b.date.getTime());
}
