
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Check if encryption is properly configured
 * @returns {boolean}
 */
export function isEncryptionConfigured() {
  const key = process.env.ENCRYPTION_KEY;
  return !!key && key.length === 64; // 64 hex chars = 32 bytes
}

/**
 * Get the encryption key as a Buffer
 * @returns {Buffer}
 */
function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY environment variable must be a 64-character hex string');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string value
 * @param {string} text - The text to encrypt
 * @returns {string} - Encrypted string in format IV:AuthTag:EncryptedData
 */
export function encryptValue(text) {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt value');
  }
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedData - The encrypted string in format IV:AuthTag:EncryptedData
 * @returns {string} - Decrypted text
 */
export function decryptValue(encryptedData) {
  if (!encryptedData) return encryptedData;
  
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt value');
  }
}
