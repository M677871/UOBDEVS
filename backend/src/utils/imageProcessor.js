const sharp = require('sharp');

const processImage = async (buffer) => {
  const base = sharp(buffer);
  const metadata = await base.metadata();

  const thumbBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 360, height: 360, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();

  const displayBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  return {
    width: metadata.width || null,
    height: metadata.height || null,
    thumbnailBuffer: thumbBuffer,
    displayBuffer,
    thumbnailMimeType: 'image/webp',
    displayMimeType: 'image/webp'
  };
};

module.exports = {
  processImage
};
