import { readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * Gera variantes @2x dos frames dos patos com vizinho mais próximo (sem suavizar os pixels).
 * O React Native escolhe a variante pela densidade da tela, então o runtime quase não precisa
 * reescalar — e é o reescalonamento em tempo de execução que borra a pixel art.
 * Rode depois de `npm run sprites`.
 */
const frames = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/pets/frames');

async function run() {
  const files = (await readdir(frames)).filter((file) => file.endsWith('.png') && !file.includes('@'));
  await Promise.all(files.map(async (file) => {
    const image = sharp(`${frames}/${file}`);
    const { width, height } = await image.metadata();
    await image.resize(width * 2, height * 2, { kernel: 'nearest' }).png({ compressionLevel: 9, palette: false })
      .toFile(`${frames}/${file.replace('.png', '@2x.png')}`);
  }));
  console.log(`${files.length} frames com variante @2x.`);
}

void run();
