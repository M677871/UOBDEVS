const { z } = require('zod');

const imageIdParamSchema = z.object({
  imageId: z.string().uuid()
});

const albumIdParamSchema = z.object({
  albumId: z.string().uuid()
});

const imageVariantParamSchema = z.object({
  imageId: z.string().uuid(),
  variant: z.enum(['thumbnail', 'display', 'original'])
});

module.exports = {
  imageIdParamSchema,
  albumIdParamSchema,
  imageVariantParamSchema
};
