import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Worker Config Cache
 * In-memory cache for worker configuration with TTL expiration
 */
class WorkerConfigCache {
  constructor() {
    this.CACHE_TTL = 300000; // 5 minutes in milliseconds
    this.CACHE_CHECK_INTERVAL = 60000; // 1 minute in milliseconds
    this.cache = new Map(); // {workerId: {config, timestamp}}
    this.cleanupInterval = null;
  }

  /**
   * Get singleton instance
   * @static
   * @returns {WorkerConfigCache} - Singleton instance
   */
  static getInstance() {
    if (!WorkerConfigCache.instance) {
      WorkerConfigCache.instance = new WorkerConfigCache();
    }
    return WorkerConfigCache.instance;
  }

  /**
   * Load worker configuration from database
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Worker configuration record
   * @throws {Error} - If worker not found
   */
  async loadWorkerConfig(workerId) {
    if (!workerId || typeof workerId !== 'string') {
      throw new Error('Worker ID must be a non-empty string');
    }

    try {
      const workers = await pb.collection('integration_workers').getFullList({
        filter: `worker_id="${workerId}"`,
        $autoCancel: false,
      });

      if (workers.length === 0) {
        throw new Error(`Worker not found: ${workerId}`);
      }

      return workers[0];
    } catch (error) {
      logger.error(`Error loading worker config for ${workerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get worker configuration with caching
   * Checks cache first, loads from database if expired or missing
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Worker configuration record
   */
  async getWorkerConfig(workerId) {
    if (!workerId || typeof workerId !== 'string') {
      throw new Error('Worker ID must be a non-empty string');
    }

    const now = Date.now();

    // Check if in cache and not expired
    if (this.cache.has(workerId)) {
      const cached = this.cache.get(workerId);
      const age = now - cached.timestamp;

      if (age < this.CACHE_TTL) {
        logger.debug(`Worker config cache hit for ${workerId}`);
        return cached.config;
      }

      // Cache expired, remove it
      this.cache.delete(workerId);
    }

    // Load from database
    logger.debug(`Worker config cache miss for ${workerId}, loading from database`);
    const config = await this.loadWorkerConfig(workerId);

    // Store in cache
    this.cache.set(workerId, {
      config,
      timestamp: now,
    });

    return config;
  }

  /**
   * Invalidate cache entry for a worker
   * @param {string} workerId - Worker ID
   */
  invalidateWorkerConfig(workerId) {
    if (!workerId || typeof workerId !== 'string') {
      logger.warn('Invalid worker ID for cache invalidation');
      return;
    }

    if (this.cache.has(workerId)) {
      this.cache.delete(workerId);
      logger.debug(`Worker config cache invalidated for ${workerId}`);
    }
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAllWorkerConfigs() {
    const size = this.cache.size;
    this.cache.clear();
    logger.debug(`Worker config cache cleared (${size} entries removed)`);
  }

  /**
   * Start periodic cleanup of expired cache entries
   */
  startCleanupInterval() {
    if (this.cleanupInterval) {
      logger.warn('Cleanup interval already running');
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this._cleanupExpiredEntries();
    }, this.CACHE_CHECK_INTERVAL);

    logger.info('Worker config cache cleanup interval started');
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Worker config cache cleanup interval stopped');
    }
  }

  /**
   * Clean up expired cache entries
   * @private
   */
  _cleanupExpiredEntries() {
    const now = Date.now();
    let removedCount = 0;

    for (const [workerId, cached] of this.cache.entries()) {
      const age = now - cached.timestamp;

      if (age >= this.CACHE_TTL) {
        this.cache.delete(workerId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`Worker config cache cleanup: removed ${removedCount} expired entries`);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats {size, ttl, checkInterval}
   */
  getStats() {
    return {
      size: this.cache.size,
      ttl: this.CACHE_TTL,
      checkInterval: this.CACHE_CHECK_INTERVAL,
      isCleanupRunning: !!this.cleanupInterval,
    };
  }
}

// Export singleton instance
export const workerConfigCache = WorkerConfigCache.getInstance();

export default workerConfigCache;
