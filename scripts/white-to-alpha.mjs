import sharp from 'sharp';

const [inputPath, outputPath, lowValue = '3', highValue = '14'] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/white-to-alpha.mjs <input> <output> [low] [high]');
}

const low = Number(lowValue);
const high = Number(highValue);
const { data, info } = await sharp(inputPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(info.width * info.height * 4);

for (let source = 0, target = 0; source < data.length; source += 3, target += 4) {
  const red = data[source];
  const green = data[source + 1];
  const blue = data[source + 2];
  const distanceFromWhite = Math.max(255 - red, 255 - green, 255 - blue);
  const alpha = Math.max(0, Math.min(255, Math.round(((distanceFromWhite - low) / (high - low)) * 255)));

  if (alpha === 0) {
    rgba[target] = 255;
    rgba[target + 1] = 255;
    rgba[target + 2] = 255;
  } else {
    const opacity = alpha / 255;
    rgba[target] = Math.max(0, Math.min(255, Math.round((red - 255 * (1 - opacity)) / opacity)));
    rgba[target + 1] = Math.max(0, Math.min(255, Math.round((green - 255 * (1 - opacity)) / opacity)));
    rgba[target + 2] = Math.max(0, Math.min(255, Math.round((blue - 255 * (1 - opacity)) / opacity)));
  }

  rgba[target + 3] = alpha;
}

await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ background: { r: 255, g: 255, b: 255, alpha: 0 }, threshold: 2 })
  .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 90, alphaQuality: 100, smartSubsample: true })
  .toFile(outputPath);
