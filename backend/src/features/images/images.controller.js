const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const imagesService = require('./images.service');
const {
  imageIdParamSchema,
  albumIdParamSchema,
  imageVariantParamSchema
} = require('./images.validation');

const getImageByVariant = asyncHandler(async (req, res) => {
  const parsed = imageVariantParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid image request');
  }

  const result = await imagesService.getImageVariant(parsed.data.imageId, parsed.data.variant);

  const etag = `W/"${parsed.data.imageId}-${parsed.data.variant}-${new Date(result.updatedAt).getTime()}"`;
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  res.setHeader('Content-Type', result.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  res.setHeader('ETag', etag);
  res.send(result.buffer);
});

const uploadImages = asyncHandler(async (req, res) => {
  const paramsParsed = albumIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    throw new ApiError(400, 'Invalid album id');
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'At least one image file is required');
  }

  const created = await imagesService.uploadImages(paramsParsed.data.albumId, req.files);
  res.status(201).json({ items: created });
});

const deleteImage = asyncHandler(async (req, res) => {
  const parsed = imageIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid image id');
  }

  const result = await imagesService.deleteImage(parsed.data.imageId);
  res.json({ item: result, message: 'Image deleted' });
});

module.exports = {
  getImageByVariant,
  uploadImages,
  deleteImage
};
