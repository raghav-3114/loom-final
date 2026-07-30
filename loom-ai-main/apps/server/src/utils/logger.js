/**
 * @file logger.js
 * @description Centralized logging utility for the backend server.
 * Provides standardized methods for logging info, debug, warn, and error messages.
 */

/**
 * Log informational messages.
 * @param {string} message 
 * @param {Object} [meta] 
 */
function info(message, meta) {
  console.log(`[INFO] ${message}`, meta || '');
}

/**
 * Log debug level messages.
 * @param {string} message 
 * @param {Object} [meta] 
 */
function debug(message, meta) {
  console.log(`[DEBUG] ${message}`, meta || '');
}

/**
 * Log warning messages.
 * @param {string} message 
 * @param {Object} [meta] 
 */
function warn(message, meta) {
  console.warn(`[WARN] ${message}`, meta || '');
}

/**
 * Log error messages.
 * @param {string} message 
 * @param {Error|Object} [errorDetails] 
 */
function error(message, errorDetails) {
  console.error(`[ERROR] ${message}`, errorDetails || '');
}

const logger = {
  info,
  debug,
  warn,
  error,
};

module.exports = {
  logger,
};
