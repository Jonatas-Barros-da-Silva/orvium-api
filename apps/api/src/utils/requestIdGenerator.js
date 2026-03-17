
import crypto from 'crypto';

/**
 * Generates a unique request ID in the format 'req_{12_char_hex}'
 * @returns {string} The generated request ID
 */
export const generateRequestId = () => {
	return `req_${crypto.randomBytes(6).toString('hex')}`;
};

/**
 * Validates if a given string matches the request ID format
 * @param {string} requestId - The request ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidRequestId = (requestId) => {
	if (!requestId || typeof requestId !== 'string') return false;
	return /^req_[0-9a-f]{12}$/.test(requestId);
};

/**
 * Extracts the random hex part from a request ID
 * @param {string} requestId - The full request ID
 * @returns {string|null} The hex portion, or null if invalid
 */
export const extractRequestId = (requestId) => {
	if (!isValidRequestId(requestId)) return null;
	return requestId.replace('req_', '');
};
