import 'dotenv/config';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Token Encryption Service
 * Encrypts and decrypts OAuth tokens using AES-256-GCM
 */
export class TokenEncryptionService {
  constructor() {
    this.encryptionKey = process.env.INTEGRATION_ENCRYPTION_KEY;
    this.algorithm = 'aes-256-gcm';

    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    // Validate key is 64 hex characters (32 bytes)
    if (!/^[0-9a-f]{64}$/i.test(this.encryptionKey)) {
      throw new Error('Invalid encryption key format. Must be 64 hex characters (32 bytes)');
    }
  }

  /**
   * Encrypt a token using AES-256-GCM
   * @param {string} token - Token to encrypt
   * @returns {Object} - {encrypted: hex-string, iv: hex-string, authTag: hex-string}
   * @throws {Error} - If encryption fails
   */
  encryptToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }

    try {
      // Convert hex key to buffer
      const keyBuffer = Buffer.from(this.encryptionKey, 'hex');

      // Generate random IV (16 bytes for GCM)
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);

      // Encrypt token
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Return all components as hex strings
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      logger.error('Token encryption failed:', error.message);
      throw new Error(`Token encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a token using AES-256-GCM
   * @param {Object} encryptedData - {encrypted: hex-string, iv: hex-string, authTag: hex-string}
   * @returns {string} - Decrypted token
   * @throws {Error} - If decryption fails or key not configured
   */
  decryptToken(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'object') {
      throw new Error('Encrypted data must be a non-empty object');
    }

    const { encrypted, iv, authTag } = encryptedData;

    if (!encrypted || typeof encrypted !== 'string') {
      throw new Error('Encrypted token must be a non-empty string');
    }

    if (!iv || typeof iv !== 'string') {
      throw new Error('IV must be a non-empty string');
    }

    if (!authTag || typeof authTag !== 'string') {
      throw new Error('Auth tag must be a non-empty string');
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    try {
      // Convert hex strings back to buffers
      const keyBuffer = Buffer.from(this.encryptionKey, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');
      const encryptedBuffer = Buffer.from(encrypted, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      // Decrypt token
      let decrypted = decipher.update(encryptedBuffer, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Token decryption failed:', error.message);
      throw new Error('Token decryption failed');
    }
  }

  /**
   * Check if data is in encrypted format
   * @param {*} data - Data to check
   * @returns {boolean} - True if data has encrypted format {encrypted, iv, authTag}
   */
  isTokenEncrypted(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    return (
      typeof data.encrypted === 'string' &&
      typeof data.iv === 'string' &&
      typeof data.authTag === 'string'
    );
  }
}

// Export singleton instance
let tokenEncryptionService = null;

try {
  tokenEncryptionService = new TokenEncryptionService();
} catch (error) {
  logger.warn('TokenEncryptionService initialization failed:', error.message);
}

export { tokenEncryptionService };
export default tokenEncryptionService;
