/**
 * @file error-handler.js
 * @description Centralized Express error handler middleware. Formats system errors,
 * validation errors, and custom API errors into standard API JSON error envelopes.
 */

const { logger } = require('../utils/logger');

/**
 * Centralized error handler middleware for Express.
 * 
 * @param {Error} err - Error object caught by Express.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
function errorHandler(err, req, res, next) {
  logger.error('Unhandled error caught by middleware', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
    },
  });
}

module.exports = {
  errorHandler,
};
