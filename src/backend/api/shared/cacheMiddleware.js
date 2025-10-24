/**
 * Cache Middleware - Cache API responses with fallback support
 */

const { cacheService } = require('./cacheService');

/**
 * Create cache middleware for GET requests
 * @param {object} options - Middleware options
 * @param {number} options.ttl - TTL in seconds (default: 300 = 5 minutes)
 * @param {function} options.keyGenerator - Custom key generator function
 * @param {boolean} options.fallbackOnError - Return cached data on error (default: true)
 * @returns {function} Express middleware
 */
function cacheMiddleware(options = {}) {
  const {
    ttl = 300,
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    fallbackOnError = true
  } = options;

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);

    // Try to get from cache first
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`[Cache] MISS: ${cacheKey}`);

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, data, ttl);
        console.log(`[Cache] CACHED: ${cacheKey} (TTL: ${ttl}s)`);
      }

      return originalJson(data);
    };

    // Handle errors with fallback
    if (fallbackOnError) {
      const originalStatus = res.status.bind(res);
      res.status = function(code) {
        if (code >= 500) {
          const fallbackData = cacheService.get(`fallback:${cacheKey}`);
          if (fallbackData) {
            console.log(`[Cache] FALLBACK: ${cacheKey}`);
            return res.json(fallbackData);
          }
        }
        return originalStatus(code);
      };
    }

    next();
  };
}

/**
 * Cache API response with long TTL for fallback
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - TTL in seconds (default: 1 day)
 */
function cacheFallback(key, data, ttl = 86400) {
  cacheService.set(`fallback:${key}`, data, ttl);
}

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match keys (e.g., 'GET:/api/services')
 */
function clearCacheByPattern(pattern) {
  const stats = cacheService.getStats();
  let cleared = 0;

  for (const key of stats.keys) {
    if (key.includes(pattern)) {
      cacheService.delete(key);
      cleared++;
    }
  }

  console.log(`[Cache] Cleared ${cleared} keys matching pattern: ${pattern}`);
  return cleared;
}

module.exports = {
  cacheMiddleware,
  cacheFallback,
  clearCacheByPattern
};
