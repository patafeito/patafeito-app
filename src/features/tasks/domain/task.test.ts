import { describe, expect, it } from '@jest/globals';
import { currentStreak, dueAtFor, formatEstimate, isOverdue, matchesSearch, parseEstimate, rewardFor, weekStart, type Task } from './task';

const task = (overrides: Partial<Task> = {}): Task => ({ id: 't', title: 'Ler', difficulty: 'medium', status: 'pending', ...overrides });

describe('prazo', () => {
  const thursday = new Date(2026, 9, 29, 15, 0);

  it('vence às 23:59 do dia escolhido; "Esta semana" vence no domingo', () => {
    expect(new Date(dueAtFor('today', thursday)!)).toEqual(new Date(2026, 9, 29, 23, 59));
    expect(new Date(dueAtFor('tomorrow', thursday)!)).toEqual(new Date(2026, 9, 30, 23, 59));
    expect(new Date(dueAtFor('week', thursday)!)).toEqual(new Date(2026, 10, 1, 23, 59));
    expect(dueAtFor('none', thursday)).toBeNull();
  });

  it('domingo: "Esta semana" é o próprio domingo', () => {
    expect(new Date(dueAtFor('week', new Date(2026, 10, 1, 9))!)).toEqual(new Date(2026, 10, 1, 23, 59));
  });

  it('a semana começa na segunda-feira', () => {
    expect(weekStart(new Date(2026, 10, 1, 9))).toEqual(new Date(2026, 9, 26));
  });

  it('só pendente com prazo passado está vencida (RN08)', () => {
    const now = new Date(2026, 9, 30, 12);
    expect(isOverdue(task({ dueAt: new Date(2026, 9, 29).toISOString() }), now)).toBe(true);
    expect(isOverdue(task({ dueAt: new Date(2026, 9, 29).toISOString(), status: 'completed' }), now)).toBe(false);
    expect(isOverdue(task({ dueAt: null }), now)).toBe(false);
  });
});

describe('recompensa (RN01, RN14)', () => {
  it('10/20/40 XP por dificuldade e nada para tarefa especial', () => {
    expect(rewardFor({ difficulty: 'easy' }).xp).toBe(10);
    expect(rewardFor({ difficulty: 'medium' }).xp).toBe(20);
    expect(rewardFor({ difficulty: 'hard' }).xp).toBe(40);
    expect(rewardFor({ difficulty: 'hard', kind: 'special' })).toEqual({ xp: 0, coins: 0 });
  });
});

describe('estimativa', () => {
  it('aceita vazio ou de 1 a 600 minutos', () => {
    expect(parseEstimate('')).toBeNull();
    expect(parseEstimate(' 25 ')).toBe(25);
    expect(parseEstimate('0')).toBeUndefined();
    expect(parseEstimate('601')).toBeUndefined();
    expect(parseEstimate('2a')).toBeUndefined();
  });

  it('formata em minutos ou horas', () => {
    expect([formatEstimate(25), formatEstimate(90), formatEstimate(120)]).toEqual(['~25 min', '~1h30', '~2h']);
  });
});

describe('busca (HU03)', () => {
  it('ignora maiúsculas e acentos, no título e na descrição', () => {
    expect(matchesSearch({ title: 'Relatório de Física' }, 'RELATORIO de fís')).toBe(true);
    expect(matchesSearch({ title: 'Correr', description: 'parque da cidade' }, 'parque')).toBe(true);
    expect(matchesSearch({ title: 'Correr' }, 'ler')).toBe(false);
    expect(matchesSearch({ title: 'Qualquer' }, '   ')).toBe(true);
  });
});

describe('sequência', () => {
  const now = new Date(2026, 9, 30, 12);
  const day = (offset: number) => new Date(2026, 9, 30 + offset, 10).toISOString();

  it('conta dias seguidos; hoje ainda sem tarefa não quebra', () => {
    expect(currentStreak([day(0), day(-1), day(-2)], now)).toBe(3);
    expect(currentStreak([day(-1), day(-2)], now)).toBe(2);
    expect(currentStreak([day(-2)], now)).toBe(0);
  });

  it('dia salvo pelo escudo conta como ativo', () => {
    expect(currentStreak([day(0), day(-2)], now, ['2026-10-29'])).toBe(3);
  });
});
