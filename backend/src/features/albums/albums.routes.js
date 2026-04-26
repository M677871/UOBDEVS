const express = require('express');
const controller = require('./albums.controller');
const { requireAuth, requireAdmin } = require('../auth/auth.middleware');

const publicRouter = express.Router();
const adminRouter = express.Router();

publicRouter.get('/', controller.listAlbums);
publicRouter.get('/:albumId', controller.getAlbumById);
publicRouter.get('/:albumId/images', controller.listAlbumImages);

adminRouter.use(requireAuth, requireAdmin);
adminRouter.post('/', controller.createAlbum);
adminRouter.put('/:albumId', controller.updateAlbum);
adminRouter.delete('/:albumId', controller.deleteAlbum);

module.exports = {
  publicRouter,
  adminRouter
};
