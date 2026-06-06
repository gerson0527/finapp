import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const iconSrc = path.join(ROOT, 'assets/images/icon.png');
const iconsDir = path.join(ROOT, 'public/icons');
const screenshotsDir = path.join(ROOT, 'public/screenshots');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function iconBuffer(size) {
  return sharp(iconSrc).resize(size, size, { fit: 'contain', background: '#0D0D0D' }).png().toBuffer();
}

async function screenshot(width, height, iconSize, outName) {
  const icon = await sharp(iconSrc)
    .resize(iconSize, iconSize, { fit: 'contain', background: { r: 13, g: 13, b: 13, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: '#0D0D0D',
    },
  })
    .composite([
      { input: icon, top: Math.round((height - iconSize) / 2 - 40), left: Math.round((width - iconSize) / 2) },
      {
        input: Buffer.from(
          `<svg width="${width}" height="80" xmlns="http://www.w3.org/2000/svg">
            <text x="50%" y="55" text-anchor="middle" fill="#AAFF00" font-family="Arial,sans-serif" font-size="28" font-weight="700">FinApp</text>
          </svg>`
        ),
        top: Math.round((height - iconSize) / 2 + iconSize + 16),
        left: 0,
      },
    ])
    .png()
    .toFile(path.join(screenshotsDir, outName));
}

await ensureDir(iconsDir);
await ensureDir(screenshotsDir);

await sharp(iconSrc).resize(192, 192, { fit: 'contain', background: '#0D0D0D' }).png().toFile(path.join(iconsDir, 'icon-192.png'));
await sharp(iconSrc).resize(512, 512, { fit: 'contain', background: '#0D0D0D' }).png().toFile(path.join(iconsDir, 'icon-512.png'));

await screenshot(390, 844, 140, 'mobile-narrow.png');
await screenshot(1280, 720, 180, 'desktop-wide.png');

console.log('PWA icons and screenshots generated in public/');
