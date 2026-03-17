
/**
 * In-memory TTL Cache Manager with statistics tracking
 */
export class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  get(key) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      return this.cache.get(key);
    }
    this.stats.misses++;
    return null;
  }

  set(key, value, ttlMs = 60000) {
    this.stats.sets++;
    this.cache.set(key, value);

    // Clear existing timeout if any
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    // Set new TTL timeout
    if (ttlMs > 0) {
      const timeout = setTimeout(() => {
        this.delete(key);
      }, ttlMs);
      this.timeouts.set(key, timeout);
    }
  }

  delete(key) {
    if (this.cache.has(key)) {
      this.stats.deletes++;
      this.cache.delete(key);
      
      if (this.timeouts.has(key)) {
        clearTimeout(this.timeouts.get(key));
        this.timeouts.delete(key);
      }
      return true;
    }
    return false;
  }

  clear() {
    this.cache.clear();
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    
    // Reset stats on clear
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: parseFloat(hitRate.toFixed(2)),
      totalRequests
    };
  }
}

// Export a singleton instance for global use
export const globalCache = new CacheManager();
