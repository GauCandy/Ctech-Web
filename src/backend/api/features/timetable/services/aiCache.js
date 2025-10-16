const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '../../../../../../debug/ai_cache');
const CACHE_ENABLED = process.env.AI_CACHE !== 'false'; // Enabled by default

/**
 * Generate hash from PDF buffer for whole-file caching
 */
function generatePDFHash(buffer) {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for shorter filenames
}

/**
 * Generate hash from text for cell-level caching (deprecated)
 */
function generateHash(text) {
  return crypto
    .createHash('sha256')
    .update(text.trim().toLowerCase())
    .digest('hex')
    .substring(0, 16);
}

/**
 * Get cached PDF result if exists (whole-file cache)
 */
async function getCachedPDFResult(pdfHash) {
  if (!CACHE_ENABLED) return null;

  try {
    const cacheFile = path.join(CACHE_DIR, `pdf_${pdfHash}.json`);
    const data = await fs.readFile(cacheFile, 'utf8');
    const cached = JSON.parse(data);

    console.log(`[PDF Cache] HIT for PDF hash: ${pdfHash}`);
    return cached.result;
  } catch (error) {
    // Cache miss or read error
    return null;
  }
}

/**
 * Save PDF result to cache (whole-file cache)
 */
async function setCachedPDFResult(pdfHash, result, metadata = {}) {
  if (!CACHE_ENABLED) return;

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const cacheFile = path.join(CACHE_DIR, `pdf_${pdfHash}.json`);

    const cacheData = {
      hash: pdfHash,
      type: 'pdf_full',
      result,
      metadata: {
        ...metadata,
        cachedAt: new Date().toISOString(),
      },
    };

    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
    console.log(`[PDF Cache] SAVED for PDF hash: ${pdfHash}`);
  } catch (error) {
    console.warn('[PDF Cache] Failed to save:', error.message);
  }
}

/**
 * Get cached AI result if exists (cell-level - deprecated but kept for backward compat)
 */
async function getCachedResult(text) {
  if (!CACHE_ENABLED) return null;

  try {
    const hash = generateHash(text);
    const cacheFile = path.join(CACHE_DIR, `${hash}.json`);

    const data = await fs.readFile(cacheFile, 'utf8');
    const cached = JSON.parse(data);

    console.log(`[AI Cache] HIT for hash: ${hash}`);
    return cached.result;
  } catch (error) {
    return null;
  }
}

/**
 * Save AI result to cache (cell-level - deprecated)
 */
async function setCachedResult(text, result) {
  if (!CACHE_ENABLED) return;

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    const hash = generateHash(text);
    const cacheFile = path.join(CACHE_DIR, `${hash}.json`);

    const cacheData = {
      hash,
      text,
      result,
      timestamp: new Date().toISOString(),
    };

    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
    console.log(`[AI Cache] SAVED for hash: ${hash}`);
  } catch (error) {
    console.warn('[AI Cache] Failed to save:', error.message);
  }
}

/**
 * Get cache stats
 */
async function getCacheStats() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const stats = {
      totalEntries: jsonFiles.length,
      cacheSize: 0,
      oldestEntry: null,
      newestEntry: null,
    };

    if (jsonFiles.length > 0) {
      const timestamps = await Promise.all(
        jsonFiles.slice(0, 100).map(async (file) => {
          const data = await fs.readFile(path.join(CACHE_DIR, file), 'utf8');
          const { timestamp } = JSON.parse(data);
          return new Date(timestamp);
        })
      );

      stats.oldestEntry = new Date(Math.min(...timestamps));
      stats.newestEntry = new Date(Math.max(...timestamps));

      // Calculate total size
      const sizes = await Promise.all(
        jsonFiles.map(async (file) => {
          const stat = await fs.stat(path.join(CACHE_DIR, file));
          return stat.size;
        })
      );
      stats.cacheSize = sizes.reduce((a, b) => a + b, 0);
    }

    return stats;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Clear all cache
 */
async function clearCache() {
  try {
    await fs.rm(CACHE_DIR, { recursive: true, force: true });
    console.log('[AI Cache] Cleared all cache');
    return true;
  } catch (error) {
    console.warn('[AI Cache] Failed to clear:', error.message);
    return false;
  }
}

module.exports = {
  CACHE_ENABLED,
  generateHash,
  generatePDFHash,
  getCachedResult,
  setCachedResult,
  getCachedPDFResult,
  setCachedPDFResult,
  getCacheStats,
  clearCache,
};
