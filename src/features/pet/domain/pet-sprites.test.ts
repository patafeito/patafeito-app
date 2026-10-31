import { describe, expect, it } from '@jest/globals';
import { moodFor } from './pet-sprites';

describe('pose de repouso', () => {
  const ok = { hunger: 80, energy: 80, happiness: 60 };

  it('qualquer status ruim deixa o pato cansado, inclusive a fome', () => {
    expect(moodFor({ ...ok, hunger: 30 })).toBe('tired');
    expect(moodFor({ ...ok, energy: 10 })).toBe('tired');
    expect(moodFor({ ...ok, happiness: 20 })).toBe('tired');
  });

  it('nunca usa a pose de comer fora da reação de alimentar', () => {
    for (const hunger of [0, 15, 30, 31, 100]) expect(moodFor({ ...ok, hunger })).not.toBe('eating');
  });

  it('sem status ruim: feliz com felicidade alta, parado no resto', () => {
    expect(moodFor({ ...ok, happiness: 85 })).toBe('happy');
    expect(moodFor(ok)).toBe('idle');
    expect(moodFor(undefined)).toBe('idle');
  });
});
