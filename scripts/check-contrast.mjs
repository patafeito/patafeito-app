import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Confere o contraste WCAG dos pares de cor que a interface usa, nos dois temas de `palette.ts`.
 * Texto precisa de 4.5:1; contornos de controle e ícones, 3:1. Sai com erro se algum par falhar.
 */
const source = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), '../src/shared/theme/palette.ts'), 'utf8');

function palette(name) {
  const block = source.match(new RegExp(`export const ${name}: Palette = \\{([\\s\\S]*?)\\n\\};`))[1];
  return Object.fromEntries([...block.matchAll(/(\w+): '(#[0-9A-Fa-f]{6})'/g)].map(([, key, value]) => [key, value]));
}

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const text = [
  ['text', 'background'], ['text', 'surface'], ['text', 'surfaceElevated'], ['text', 'surfaceMuted'],
  ['textSecondary', 'background'], ['textSecondary', 'surface'], ['textSecondary', 'surfaceElevated'], ['textSecondary', 'surfaceMuted'],
  ['primary', 'background'], ['primary', 'surface'], ['onPrimary', 'primary'], ['onPrimary', 'danger'],
  ['onPrimarySoft', 'primarySoft'], ['onSuccessSoft', 'successSoft'], ['onWarningSoft', 'warningSoft'], ['onDangerSoft', 'dangerSoft'],
  ['success', 'surface'], ['danger', 'surface'], ['danger', 'surfaceElevated'], ['rewardText', 'surface'], ['rewardText', 'rewardSoft'],
  ['tertiary', 'surface'], ['achievement', 'surface'], ['onPrimarySoft', 'surface'],
];
const ui = [['borderStrong', 'surface'], ['borderStrong', 'background'], ['primary', 'surfaceElevated'], ['success', 'surfaceMuted']];

let failed = 0;
for (const name of ['darkPalette', 'lightPalette']) {
  const colors = palette(name);
  console.log(`\n${name}`);
  for (const [pairs, minimum] of [[text, 4.5], [ui, 3]]) {
    for (const [fg, bg] of pairs) {
      const value = ratio(colors[fg], colors[bg]);
      const ok = value >= minimum;
      if (!ok) failed += 1;
      console.log(`${ok ? '  ok ' : 'FAIL '} ${fg.padEnd(14)} on ${bg.padEnd(16)} ${value.toFixed(2)} (min ${minimum})`);
    }
  }
}
if (failed) {
  console.error(`\n${failed} par(es) abaixo do mínimo.`);
  process.exit(1);
}
