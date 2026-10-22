export function levelForXp(xpTotal: number): number {
  let level = 1;
  let threshold = 0;
  while (xpTotal >= threshold + level * 100) {
    threshold += level * 100;
    level += 1;
  }
  return level;
}

export function xpThresholdForLevel(level: number): number {
  let threshold = 0;
  for (let current = 1; current < level; current += 1) threshold += current * 100;
  return threshold;
}

export function levelProgress(xpTotal: number) {
  const level = levelForXp(xpTotal);
  const start = xpThresholdForLevel(level);
  return { level, value: xpTotal - start, nextLevelAt: level * 100 };
}
