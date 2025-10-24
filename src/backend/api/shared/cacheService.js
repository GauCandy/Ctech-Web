/**
 * Cache Service - In-memory caching with TTL support
 * Sử dụng để cache data khi database mất kết nối
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   */
  set(key, value, ttl = 3600) {
    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + (ttl * 1000));
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expiry = this.ttls.get(key);
    if (expiry && Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear() {
    this.cache.clear();
    this.ttls.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttls.entries()) {
      if (now > expiry) {
        this.delete(key);
      }
    }
  }

  /**
   * Destroy cache service and cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = { cacheService, CacheService };
