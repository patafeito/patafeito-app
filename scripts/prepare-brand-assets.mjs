import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const assets = resolve(dirname(fileURLToPath(import.meta.url)), '../assets');

const iconCanvas = 1024;
const safeFraction = 0.68;
const bannerWidth = 1024;

async function buildAdaptiveForeground() {
  const art = Math.round(iconCanvas * safeFraction);
  const resized = await sharp(`${assets}/icon.png`).resize(art, art, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const offset = Math.round((iconCanvas - art) / 2);
  const output = await sharp({ create: { width: iconCanvas, height: iconCanvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left: offset, top: offset }])
    .png({ compressionLevel: 9 }).toBuffer();
  await writeFile(`${assets}/android-icon-foreground.png`, output);
  console.log(`android-icon-foreground.png: arte a ${Math.round(safeFraction * 100)}% de ${iconCanvas}px`);
}

function isNeutral(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min <= 12 && min >= 100 && max <= 240;
}

async function buildBanner() {
  const { data, info } = await sharp(`${assets}/banner.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const colorAt = (x, y) => {
    const offset = (y * width + x) * channels;
    return [data[offset], data[offset + 1], data[offset + 2]];
  };
  const flattenedCheckerboard = [[2, 2], [width - 3, 2], [2, height - 3], [width - 3, height - 3]]
    .every(([x, y]) => isNeutral(...colorAt(x, y)));

  if (flattenedCheckerboard) {
    const visited = new Uint8Array(width * height);
    const queue = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const index = y * width + x;
      if (visited[index]) return;
      const offset = index * channels;
      if (!isNeutral(data[offset], data[offset + 1], data[offset + 2])) return;
      visited[index] = 1;
      queue.push(index);
    };

    for (let x = 0; x < width; x += 1) { push(x, 0); push(x, height - 1); }
    for (let y = 0; y < height; y += 1) { push(0, y); push(width - 1, y); }

    for (let head = 0; head < queue.length; head += 1) {
      const index = queue[head];
      const x = index % width;
      const y = Math.floor(index / width);
      data[index * channels + 3] = 0;
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }
  }

  const pipeline = sharp(data, { raw: { width, height, channels } });
  if (flattenedCheckerboard) pipeline.trim({ threshold: 1 });
  const output = await pipeline
    .resize({ width: bannerWidth, withoutEnlargement: true })
    .png({ palette: true, quality: 90, effort: 10 }).toBuffer();
  await writeFile(`${assets}/banner-prepared.png`, output);
  const result = await sharp(output).metadata();
  console.log(`banner-prepared.png: ${result.width}×${result.height}${flattenedCheckerboard ? ' (xadrez removido)' : ''}`);
}

async function buildFavicon() {
  const output = await sharp(`${assets}/icon.png`).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(`${assets}/favicon.png`, output);
  console.log('favicon.png: 96×96');
}

await buildAdaptiveForeground();
await buildBanner();
await buildFavicon();
