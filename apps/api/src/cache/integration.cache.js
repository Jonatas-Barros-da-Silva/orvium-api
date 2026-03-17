
import pb from '../utils/pocketbaseClient.js';
import { globalCache } from './cache.manager.js';
import logger from '../utils/logger.js';

const DEFAULT_TTL_MS = 60000; // 60 seconds

export class IntegrationCache {
  constructor(cacheManager = globalCache) {
    this.cache = cacheManager;
  }

  _generateKey(type, id) {
    return `integration:${type}:${id}`;
  }

  async getApp(appId) {
    const key = this._generateKey('app', appId);
    let app = this.cache.get(key);
    
    if (!app) {
      try {
        app = await pb.collection('integration_apps').getOne(appId, { $autoCancel: false });
        this.cache.set(key, app, DEFAULT_TTL_MS);
      } catch (error) {
        logger.error(`Cache miss & fetch failed for app ${appId}:`, error.message);
        return null;
      }
    }
    return app;
  }

  async getVersion(versionId) {
    const key = this._generateKey('version', versionId);
    let version = this.cache.get(key);
    
    if (!version) {
      try {
        version = await pb.collection('integration_versions').getOne(versionId, { $autoCancel: false });
        this.cache.set(key, version, DEFAULT_TTL_MS);
      } catch (error) {
        logger.error(`Cache miss & fetch failed for version ${versionId}:`, error.message);
        return null;
      }
    }
    return version;
  }

  async getCapabilities(versionId) {
    const key = this._generateKey('capabilities', versionId);
    let capabilities = this.cache.get(key);
    
    if (!capabilities) {
      try {
        capabilities = await pb.collection('integration_capabilities').getFullList({
          filter: `integration_version_id="${versionId}" && is_active=true`,
          $autoCancel: false
        });
        this.cache.set(key, capabilities, DEFAULT_TTL_MS);
      } catch (error) {
        logger.error(`Cache miss & fetch failed for capabilities of version ${versionId}:`, error.message);
        return [];
      }
    }
    return capabilities;
  }

  async getActions(capabilityId) {
    const key = this._generateKey('actions', capabilityId);
    let actions = this.cache.get(key);
    
    if (!actions) {
      try {
        actions = await pb.collection('capability_actions').getFullList({
          filter: `capability_id="${capabilityId}" && is_active=true`,
          $autoCancel: false
        });
        this.cache.set(key, actions, DEFAULT_TTL_MS);
      } catch (error) {
        logger.error(`Cache miss & fetch failed for actions of capability ${capabilityId}:`, error.message);
        return [];
      }
    }
    return actions;
  }

  invalidateApp(appId) {
    this.cache.delete(this._generateKey('app', appId));
  }

  invalidateVersion(versionId) {
    this.cache.delete(this._generateKey('version', versionId));
    this.cache.delete(this._generateKey('capabilities', versionId));
  }

  invalidateCapability(capabilityId) {
    this.cache.delete(this._generateKey('actions', capabilityId));
  }

  clearAll() {
    // Note: This clears the entire global cache, not just integration keys.
    // In a more complex setup, we'd use namespaces or prefix matching.
    this.cache.clear();
  }
}

export const integrationCache = new IntegrationCache();
