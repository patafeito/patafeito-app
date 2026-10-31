import { describe, expect, it } from '@jest/globals';
import { emotionFor, xpEarnedToday } from './emotion';
import { canPamper, minutesUntilPamper, petAfterPamper } from './stats';
import type { Pet } from './pet';

const now = new Date(2026, 9, 30, 15);
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();
const stats = { hunger: 80, energy: 80, happiness: 80 };
const goalMet = { targetXp: 60, earnedXp: 60 };

describe('humor (espelho da API)', () => {
  it('feliz com a meta cumprida (RN13) e neutro abaixo dela', () => {
    expect(emotionFor({ lastActivityAt: hoursAgo(1) }, stats, goalMet, now)).toBe('happy');
    expect(emotionFor({ lastActivityAt: hoursAgo(1) }, stats, { targetXp: 60, earnedXp: 20 }, now)).toBe('neutral');
  });

  it('triste com 3 vencidas seguidas (RN02) ou mais de 24h parado (RN11)', () => {
    expect(emotionFor({ overdueStreak: 3, lastActivityAt: hoursAgo(1) }, stats, goalMet, now)).toBe('sad');
    expect(emotionFor({ lastActivityAt: hoursAgo(25) }, stats, goalMet, now)).toBe('sad');
  });

  it('abatido quando algum status está muito baixo', () => {
    expect(emotionFor({ lastActivityAt: hoursAgo(1) }, { ...stats, hunger: 10 }, goalMet, now)).toBe('down');
  });

  it('soma só o XP de tarefas concluídas hoje', () => {
    const today = now.toISOString();
    expect(xpEarnedToday([
      { status: 'completed', completedAt: today, difficulty: 'medium' },
      { status: 'completed', completedAt: today, difficulty: 'hard', kind: 'special' },
      { status: 'completed', completedAt: hoursAgo(48), difficulty: 'hard' },
      { status: 'pending', completedAt: null, difficulty: 'hard' },
    ], now)).toBe(20);
  });
});

describe('mimar', () => {
  const pet: Pet = { id: 'p', speciesId: 'pingo', name: 'Pingo', level: 1, xpTotal: 0, hunger: 50, energy: 50, happiness: 97, statsUpdatedAt: now.toISOString(), version: 1 };

  it('dá +5 de felicidade (limitado a 100) e marca a hora do carinho', () => {
    expect(petAfterPamper(pet, now)).toMatchObject({ happiness: 100, energy: 50, hunger: 50, lastPamperedAt: now.toISOString() });
    expect(petAfterPamper({ ...pet, happiness: 60 }, now).happiness).toBe(65);
  });

  it('conta uma vez por hora', () => {
    expect(canPamper(pet, now)).toBe(true);
    expect(canPamper({ lastPamperedAt: hoursAgo(0.5) }, now)).toBe(false);
    expect(minutesUntilPamper({ lastPamperedAt: hoursAgo(0.5) }, now)).toBe(30);
    expect(canPamper({ lastPamperedAt: hoursAgo(1) }, now)).toBe(true);
  });
});
