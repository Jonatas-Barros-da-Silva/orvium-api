import crypto from 'crypto';
import { randomUUID } from 'crypto';

/**
 * Generate a new API key with prefix and random characters
 * Format: orv_{environment}_{random_32_chars_base64url}
 * @param {string} environment - Environment name (e.g., 'test', 'live')
 * @returns {string} - API key in format orv_{environment}_{random_32_chars}
 */
export function generateApiKey(environment) {
	if (!environment || typeof environment !== 'string') {
		throw new Error('Environment must be a non-empty string');
	}

	const randomBytes = crypto.randomBytes(24);
	const base64url = randomBytes
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');

	return `orv_${environment}_${base64url}`;
}

/**
 * Hash an API key using SHA-256
 * @param {string} key - API key to hash
 * @returns {string} - SHA-256 hash in hex format
 */
export function hashApiKey(key) {
	if (!key || typeof key !== 'string') {
		throw new Error('Key must be a non-empty string');
	}

	return crypto
		.createHash('sha256')
		.update(key)
		.digest('hex');
}

/**
 * Get the prefix of an API key (first 8 characters)
 * @param {string} key - API key
 * @returns {string} - First 8 characters of the key
 */
export function getKeyPrefix(key) {
	if (!key || typeof key !== 'string') {
		throw new Error('Key must be a non-empty string');
	}

	return key.substring(0, 8);
}

/**
 * Validate API key format
 * Format: orv_{environment}_{random_32_chars}
 * Environment must be 'test' or 'live'
 * Total length must be >= 40 characters
 * @param {string} key - API key to validate
 * @returns {boolean} - True if format is valid
 */
export function validateKeyFormat(key) {
	if (!key || typeof key !== 'string') {
		return false;
	}

	// Check minimum length
	if (key.length < 40) {
		return false;
	}

	// Check starts with 'orv_'
	if (!key.startsWith('orv_')) {
		return false;
	}

	const parts = key.split('_');

	// Must have exactly 3 parts: prefix, environment, random
	if (parts.length !== 3) {
		return false;
	}

	const [prefix, environment] = parts;

	// Prefix must be 'orv'
	if (prefix !== 'orv') {
		return false;
	}

	// Environment must be 'test' or 'live'
	if (environment !== 'test' && environment !== 'live') {
		return false;
	}

	return true;
}

/**
 * Generate a UUID v4 request ID
 * @returns {string} - UUID v4 string
 */
export function generateRequestId() {
	return randomUUID();
}
