const express = require('express');
const upload = require('../../middlewares/upload.middleware');
const controller = require('./images.controller');
const { requireAuth, requireAdmin } = require('../auth/auth.middleware');

const publicRouter = express.Router();
const adminRouter = express.Router();

publicRouter.get('/:imageId/:variant', controller.getImageByVariant);

adminRouter.use(requireAuth, requireAdmin);
adminRouter.post('/albums/:albumId/images', upload.array('images', 20), controller.uploadImages);
adminRouter.delete('/images/:imageId', controller.deleteImage);

module.exports = {
  publicRouter,
  adminRouter
};
