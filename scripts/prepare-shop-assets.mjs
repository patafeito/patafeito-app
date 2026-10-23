import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * Recorta as folhas da loja (comidas, poderes, moedas) em ícones avulsos e reduz os cenários.
 * Entrada: assets/comidas.png, assets/poderes.png, assets/moedas.png e assets/cenarios/*.png.
 * Saída: assets/shop/<sku>.png e assets/shop/scene-<nome>.jpg. Rode com `npm run shop-assets`.
 */
const assets = resolve(dirname(fileURLToPath(import.meta.url)), '../assets');
const output = `${assets}/shop`;

const sheets = {
  'comidas.png': ['food-bread', 'food-corn', 'food-lettuce', 'food-fish', 'food-watermelon', 'food-cupcake'],
  'poderes.png': ['power-streak-shield', 'power-double-xp', 'power-energy-coffee', 'power-lucky-clover', 'power-focus-hourglass'],
  'moedas.png': ['coin', 'coin-sparkle', 'coin-tilted', 'coin-edge', 'coin-stack', 'coin-pile'],
};
const scenes = ['biblioteca', 'cafe', 'lago', 'noite', 'praia'];

const iconSize = 256;
const padding = 8;
// Brilhos e auras ficam a alguns pixels do item: lacunas menores que isso não separam itens.
const maxGap = 24;

async function itemBoxes(file, expected, alphaMin = 40) {
  const { data, info } = await sharp(`${assets}/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const solid = (x, y) => data[(y * width + x) * channels + 3] >= alphaMin;

  const density = new Array(width).fill(0);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) if (solid(x, y)) density[x] += 1;
  }
  const runs = [];
  let start = -1;
  let lastFilled = -1;
  for (let x = 0; x < width; x += 1) {
    if (!density[x]) continue;
    if (start < 0) start = x;
    else if (x - lastFilled > maxGap) { runs.push([start, lastFilled]); start = x; }
    lastFilled = x;
  }
  if (start >= 0) runs.push([start, lastFilled]);

  const items = runs.filter(([a, b]) => b - a > width * 0.02);
  // Itens encostados (um brilho por cima do vizinho): corta o trecho mais largo na coluna mais vazia do miolo.
  while (items.length < expected) {
    const widest = items.reduce((best, run, index) => (run[1] - run[0] > items[best][1] - items[best][0] ? index : best), 0);
    const [a, b] = items[widest];
    const margin = Math.floor((b - a) * 0.25);
    let cut = a + margin;
    for (let x = a + margin; x <= b - margin; x += 1) if (density[x] < density[cut]) cut = x;
    items.splice(widest, 1, [a, cut - 1], [cut, b]);
  }
  if (items.length !== expected) throw new Error(`${file}: ${items.length} itens encontrados, ${expected} esperados.`);

  return items.map(([x0, x1]) => {
    let top = height;
    let bottom = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = x0; x <= x1; x += 1) if (solid(x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); break; }
    }
    return { left: x0, top, width: x1 - x0 + 1, height: bottom - top + 1 };
  });
}

async function sliceSheet(file, names) {
  const boxes = await itemBoxes(file, names.length);
  for (const [index, box] of boxes.entries()) {
    await sharp(`${assets}/${file}`)
      .extract(box)
      .resize(iconSize - padding * 2, iconSize - padding * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(`${output}/${names[index]}.png`);
  }
  console.log(`${file}: ${names.length} ícones`);
}

await mkdir(output, { recursive: true });
for (const [file, names] of Object.entries(sheets)) await sliceSheet(file, names);
for (const scene of scenes) {
  await sharp(`${assets}/cenarios/${scene}.png`).resize(1000, 800, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${output}/scene-${scene}.jpg`);
}
console.log(`cenários: ${scenes.length}`);
