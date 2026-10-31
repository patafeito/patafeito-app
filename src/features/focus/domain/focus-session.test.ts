import { describe, expect, it } from '@jest/globals';
import { cycleProgress, focusRewards, formatRemaining, isComplete, nextBreak, normalizePreset, remainingSeconds, type FocusSession, type FocusSettings } from './focus-session';

const pomodoro: FocusSettings = { preset: 'pomodoro', focusMinutes: 25, breakMinutes: 5 };

describe('pausa (RN05)', () => {
  it('Pomodoro: 5 min e pausa longa de 15 a cada 4 ciclos', () => {
    expect([1, 2, 3, 4, 5, 8].map((cycle) => nextBreak(pomodoro, cycle))).toEqual([
      { seconds: 300, long: false, cyclesBeforeLong: 4 },
      { seconds: 300, long: false, cyclesBeforeLong: 4 },
      { seconds: 300, long: false, cyclesBeforeLong: 4 },
      { seconds: 900, long: true, cyclesBeforeLong: 4 },
      { seconds: 300, long: false, cyclesBeforeLong: 4 },
      { seconds: 900, long: true, cyclesBeforeLong: 4 },
    ]);
  });

  it('Deep Work faz pausa longa a cada 2; personalizado nunca', () => {
    expect(nextBreak({ preset: 'deep_work', focusMinutes: 50, breakMinutes: 10 }, 2)).toMatchObject({ seconds: 1200, long: true });
    expect(nextBreak({ preset: 'custom', focusMinutes: 30, breakMinutes: 7 }, 4)).toEqual({ seconds: 420, long: false });
  });

  it('mostra a posição na série até a pausa longa', () => {
    expect(cycleProgress(pomodoro, 0)).toEqual({ current: 1, total: 4 });
    expect(cycleProgress(pomodoro, 3)).toEqual({ current: 4, total: 4 });
    expect(cycleProgress({ ...pomodoro, preset: 'custom' }, 3)).toBeUndefined();
  });

  it('converte os ritmos gravados por versões antigas', () => {
    expect([normalizePreset('classic'), normalizePreset('short'), normalizePreset('long'), normalizePreset('xyz')]).toEqual(['pomodoro', 'sprint', 'deep_work', 'pomodoro']);
  });
});

describe('temporizador', () => {
  const session: FocusSession = { id: 's', startedAt: '2026-10-30T12:00:00.000Z', durationSeconds: 1500, status: 'active' };
  const at = (minutes: number) => new Date('2026-10-30T12:00:00.000Z').getTime() + minutes * 60_000;

  it('calcula o tempo restante pelo relógio, não por contagem', () => {
    expect(remainingSeconds(session, at(10))).toBe(900);
    expect(isComplete(session, at(24))).toBe(false);
    expect(isComplete(session, at(25))).toBe(true);
  });

  it('pausado, o tempo para no instante da pausa', () => {
    const paused: FocusSession = { ...session, status: 'paused', pausedAt: '2026-10-30T12:05:00.000Z' };
    expect(remainingSeconds(paused, at(20))).toBe(1200);
  });

  it('formata mm:ss e recompensa proporcional (RN04)', () => {
    expect(formatRemaining(905)).toBe('15:05');
    expect(focusRewards(1500)).toEqual({ xp: 20, coins: 5 });
    expect(focusRewards(3000)).toEqual({ xp: 40, coins: 10 });
  });
});
