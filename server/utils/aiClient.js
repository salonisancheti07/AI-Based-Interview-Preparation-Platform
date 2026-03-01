const crypto = require('crypto');

// Simple in-memory cache with TTL
const cache = new Map();
const MAX_ITEMS = 200;

const hashKey = (key) => crypto.createHash('md5').update(key).digest('hex');

function getCache(key) {
  const now = Date.now();
  const hashed = hashKey(key);
  const entry = cache.get(hashed);
  if (!entry) return null;
  if (entry.expireAt < now) {
    cache.delete(hashed);
    return null;
  }
  return entry.value;
}

function setCache(key, value, ttlMs = 2 * 60 * 1000) {
  const hashed = hashKey(key);
  if (cache.size >= MAX_ITEMS) {
    // remove oldest
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(hashed, { value, expireAt: Date.now() + ttlMs });
}

async function withRetry(fn, { retries = 2, baseDelay = 250, maxDelay = 2000 } = {}) {
  let attempt = 0;
  let lastError;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt)) + Math.floor(Math.random() * 100);
      await new Promise((res) => setTimeout(res, delay));
    }
    attempt += 1;
  }
  throw lastError;
}

module.exports = {
  getCache,
  setCache,
  withRetry,
};
