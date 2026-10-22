import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const assets = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/pets');
const output = `${assets}/frames`;

const species = ['pingo', 'mare', 'bento'];
const poses = ['happy', 'cheer', 'focus', 'tired', 'eating'];
const blinkSheet = { pingo: 'base2.png', mare: 'base1.png', bento: 'base2.png' };

const referenceHeight = 384;
const padding = 8;

async function spriteBoxes(file, expected, alphaMin = 200) {
  const { data, info } = await sharp(`${assets}/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const solid = (x, y) => data[(y * width + x) * channels + 3] >= alphaMin;

  const columns = new Array(width).fill(0);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) if (solid(x, y)) columns[x] += 1;
  }
  const limit = Math.max(2, Math.max(...columns) * 0.02);
  const runs = [];
  let start = -1;
  for (let x = 0; x < width; x += 1) {
    const filled = columns[x] > limit;
    if (filled && start < 0) start = x;
    if (!filled && start >= 0) { runs.push([start, x - 1]); start = -1; }
  }
  if (start >= 0) runs.push([start, width - 1]);

  const wide = runs.filter(([a, b]) => b - a > width * 0.03);
  if (wide.length !== expected) throw new Error(`${file}: ${wide.length} sprites encontrados, ${expected} esperados.`);

  return wide.map(([x0, x1]) => {
    let top = height;
    let bottom = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        if (solid(x, y)) { if (y < top) top = y; if (y > bottom) bottom = y; break; }
      }
    }
    return { left: x0, top, width: x1 - x0 + 1, height: bottom - top + 1 };
  });
}

async function cut(file, box, scale) {
  const width = Math.round(box.width * scale);
  const height = Math.round(box.height * scale);
  const buffer = await sharp(`${assets}/${file}`).extract(box).resize(width, height, { kernel: 'lanczos3' }).png().toBuffer();
  return { buffer, width, height };
}

async function run() {
  await mkdir(output, { recursive: true });
  const manifest = {};
  const [base1, base2, ...sheets] = await Promise.all([
    spriteBoxes('base1.png', 3),
    spriteBoxes('base2.png', 3),
    ...species.map((name) => spriteBoxes(`${name}.png`, poses.length)),
  ]);

  for (const [index, name] of species.entries()) {
    const blinkFromBase1 = blinkSheet[name] === 'base1.png';
    const openBox = blinkFromBase1 ? base2[index] : base1[index];
    const blinkBox = blinkFromBase1 ? base1[index] : base2[index];
    const poseBoxes = sheets[index];

    const frames = await Promise.all([
      cut(blinkFromBase1 ? 'base2.png' : 'base1.png', openBox, referenceHeight / openBox.height).then((frame) => ({ state: 'idle', ...frame })),
      cut(blinkFromBase1 ? 'base1.png' : 'base2.png', blinkBox, referenceHeight / openBox.height).then((frame) => ({ state: 'blink', ...frame })),
      ...poseBoxes.map((box, pose) => cut(`${name}.png`, box, referenceHeight / poseBoxes[0].height).then((frame) => ({ state: poses[pose], ...frame }))),
    ]);

    const canvasWidth = Math.max(...frames.map((frame) => frame.width)) + padding * 2;
    const canvasHeight = Math.max(...frames.map((frame) => frame.height)) + padding * 2;

    for (const frame of frames) {
      const canvas = sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
      const composed = await canvas.composite([{
        input: frame.buffer,
        left: Math.round((canvasWidth - frame.width) / 2),
        top: canvasHeight - padding - frame.height,
      }]).png({ palette: true, quality: 90, effort: 10 }).toBuffer();
      await writeFile(`${output}/${name}-${frame.state}.png`, composed);
    }

    manifest[name] = { width: canvasWidth, height: canvasHeight };
    console.log(`${name}: ${frames.length} quadros em ${canvasWidth}×${canvasHeight}`);
  }

  await writeFile(`${output}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
}

await run();
