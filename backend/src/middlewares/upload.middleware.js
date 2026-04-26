const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploadMaxFileSizeMb * 1024 * 1024,
    files: 20
  },
  fileFilter(req, file, cb) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  }
});

module.exports = upload;
