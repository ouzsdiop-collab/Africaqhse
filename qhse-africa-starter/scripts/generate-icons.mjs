/**
 * Génère les PNG PWA depuis les SVG (Android / iOS).
 * Usage : node scripts/generate-icons.mjs
 */
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const iconsDir = path.join(root, 'public', 'icons');

const BG = { r: 15, g: 23, b: 42, alpha: 1 };

/**
 * Icône maskable : marge 20 % de chaque côté → zone utile = 60 % du côté.
 * @param {Buffer} svgBuf
 * @param {number} outSize
 */
async function writeMaskablePng(svgBuf, outSize) {
  const inner = Math.round(outSize * 0.6);
  const resized = await sharp(svgBuf)
    .resize(inner, inner, {
      fit: 'contain',
      background: BG
    })
    .png()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const w = meta.width ?? inner;
  const h = meta.height ?? inner;
  const left = Math.round((outSize - w) / 2);
  const top = Math.round((outSize - h) / 2);

  await sharp({
    create: {
      width: outSize,
      height: outSize,
      channels: 4,
      background: BG
    }
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(path.join(iconsDir, `icon-maskable-${outSize}.png`));
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  const svg192 = await readFile(path.join(iconsDir, 'icon-192.svg'));
  const svg512 = await readFile(path.join(iconsDir, 'icon-512.svg'));

  await sharp(svg192).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));

  await sharp(svg512).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));

  await writeMaskablePng(svg192, 192);
  await writeMaskablePng(svg512, 512);

  console.log('OK — public/icons/icon-{192,512}.png et icon-maskable-{192,512}.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
