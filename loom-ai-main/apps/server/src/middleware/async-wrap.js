/**
 * @file async-wrap.js
 * @description Higher-order wrapper utility for Express route handlers to catch unhandled
 * promise rejections and pass them cleanly to the centralized error middleware.
 */

/**
 * Wraps an async route handler function.
 * 
 * @param {Function} fn - Async Express route handler (req, res, next).
 * @returns {Function} Express route handler with automatic error forwarding.
 */
function asyncWrap(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  asyncWrap,
};
