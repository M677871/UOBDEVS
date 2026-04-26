const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const albumsService = require('./albums.service');
const imagesService = require('../images/images.service');
const {
  uuidParamSchema,
  listQuerySchema,
  createAlbumSchema,
  updateAlbumSchema
} = require('./albums.validation');

const listAlbums = asyncHandler(async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid pagination query', parsed.error.flatten());
  }

  const data = await albumsService.listAlbums(parsed.data);
  res.json(data);
});

const getAlbumById = asyncHandler(async (req, res) => {
  const parsedParams = uuidParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new ApiError(400, 'Invalid album id', parsedParams.error.flatten());
  }

  const album = await albumsService.getAlbumById(parsedParams.data.albumId);
  res.json({ item: album });
});

const listAlbumImages = asyncHandler(async (req, res) => {
  const parsedParams = uuidParamSchema.safeParse(req.params);
  const parsedQuery = listQuerySchema.safeParse(req.query);

  if (!parsedParams.success || !parsedQuery.success) {
    throw new ApiError(400, 'Invalid album images request');
  }

  const data = await imagesService.listImagesByAlbum(parsedParams.data.albumId, parsedQuery.data);
  res.json(data);
});

const createAlbum = asyncHandler(async (req, res) => {
  const parsed = createAlbumSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid create album payload', parsed.error.flatten());
  }

  const created = await albumsService.createAlbum(parsed.data);
  res.status(201).json({ item: created });
});

const updateAlbum = asyncHandler(async (req, res) => {
  const parsedParams = uuidParamSchema.safeParse(req.params);
  const parsedPayload = updateAlbumSchema.safeParse(req.body);

  if (!parsedParams.success || !parsedPayload.success) {
    throw new ApiError(400, 'Invalid update album request');
  }

  const updated = await albumsService.updateAlbum(parsedParams.data.albumId, parsedPayload.data);
  res.json({ item: updated });
});

const deleteAlbum = asyncHandler(async (req, res) => {
  const parsed = uuidParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid album id', parsed.error.flatten());
  }

  const deleted = await albumsService.deleteAlbum(parsed.data.albumId);
  res.json({ item: deleted, message: 'Album deleted' });
});

module.exports = {
  listAlbums,
  getAlbumById,
  listAlbumImages,
  createAlbum,
  updateAlbum,
  deleteAlbum
};
