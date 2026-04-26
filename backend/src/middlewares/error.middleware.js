const ApiError = require('../utils/ApiError');

module.exports = (err, req, res, next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const payload = {
    message: err.message || 'Internal server error'
  };

  if (err instanceof ApiError && err.details) {
    payload.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && !(err instanceof ApiError)) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};
