/**
 * LLM Cache Service
 * Smart caching for OpenAI API responses to optimize costs and performance
 */

class LLMCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 500; // Max cache entries
    this.ttl = 24 * 60 * 60 * 1000; // 24 hours TTL
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0
    };
    this.loadFromStorage();
  }

  /**
   * Generate cache key from prompt and parameters
   */
  generateKey(prompt, model = 'gpt-3.5-turbo', params = {}) {
    const key = `${model}:${this.hashString(prompt)}:${JSON.stringify(params)}`;
    return key;
  }

  /**
   * Simple hash function for strings
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get cached response
   */
  get(prompt, model = 'gpt-3.5-turbo', params = {}) {
    const key = this.generateKey(prompt, model, params);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      this.stats.hits++;
      return cached.response;
    }

    if (cached) {
      this.cache.delete(key);
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set cached response
   */
  set(prompt, response, model = 'gpt-3.5-turbo', params = {}) {
    const key = this.generateKey(prompt, model, params);

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      model,
      promptLength: prompt.length
    });

    this.stats.saves++;
    this.saveToStorage();
  }

  /**
   * Clear old cache entries
   */
  clearExpired() {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Clear entire cache
   */
  clearAll() {
    this.cache.clear();
    localStorage.removeItem('llmCache');
    this.stats = { hits: 0, misses: 0, saves: 0 };
  }

  /**
   * Save cache to localStorage
   */
  saveToStorage() {
    try {
      const cacheData = Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        ...value
      }));

      localStorage.setItem('llmCache', JSON.stringify({
        cache: cacheData,
        stats: this.stats,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to save cache to storage:', e);
    }
  }

  /**
   * Load cache from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('llmCache');
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();

        data.cache.forEach(item => {
          if (now - item.timestamp < this.ttl) {
            this.cache.set(item.key, {
              response: item.response,
              timestamp: item.timestamp,
              model: item.model,
              promptLength: item.promptLength
            });
          }
        });

        this.stats = data.stats;
      }
    } catch (e) {
      console.warn('Failed to load cache from storage:', e);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      maxSize: this.maxSize
    };
  }

  /**
   * Warm cache with common prompts
   */
  async warmCache(commonPrompts) {
    // This would typically be called during initialization
    // to pre-populate common responses
    return {
      preloaded: commonPrompts.length,
      currentSize: this.cache.size
    };
  }
}

export default new LLMCache();
