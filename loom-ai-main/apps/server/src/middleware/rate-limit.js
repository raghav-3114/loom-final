/**
 * @file rate-limit.js
 * @description Simple in-memory per-IP rate limiter for AI-invoking endpoints.
 * No external dependency — sufficient for MVP scope (single small server instance, no multi-instance sync needed).
 */

/**
 * Creates a request-count-per-IP-per-window limiter middleware.
 * @param {Object} options
 * @param {number} options.windowMs - Size of the sliding window in milliseconds.
 * @param {number} options.max - Max requests allowed per IP within the window.
 * @returns {Function} Express middleware.
 */
function rateLimit({ windowMs, max }) {
  const hits = new Map(); // ip -> array of request timestamps

  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const timestamps = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    timestamps.push(now);
    hits.set(ip, timestamps);

    if (timestamps.length > max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests — please slow down and try again in a moment.',
      });
    }

    next();
  };
}

module.exports = { rateLimit };
