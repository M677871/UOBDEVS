const { z } = require('zod');

const uuidParamSchema = z.object({
  albumId: z.string().uuid()
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(20)
});

const createAlbumSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable()
});

const updateAlbumSchema = createAlbumSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field must be provided' }
);

module.exports = {
  uuidParamSchema,
  listQuerySchema,
  createAlbumSchema,
  updateAlbumSchema
};
