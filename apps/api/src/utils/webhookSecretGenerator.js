import crypto from 'crypto';

/**
 * Generate a new webhook secret in format: whsec_{32_hex_chars}
 * @returns {string} - Webhook secret (e.g., 'whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')
 */
export function generateWebhookSecret() {
	const randomBytes = crypto.randomBytes(16);
	const hexString = randomBytes.toString('hex');
	return `whsec_${hexString}`;
}

/**
 * Validate webhook secret format
 * Format: whsec_{32_hex_chars}
 * Total length: 38 characters
 * @param {string} secret - Webhook secret to validate
 * @returns {boolean} - True if format is valid
 */
export function isValidWebhookSecret(secret) {
	if (!secret || typeof secret !== 'string') {
		return false;
	}

	// Check length (whsec_ = 6 chars + 32 hex chars = 38 total)
	if (secret.length !== 38) {
		return false;
	}

	// Check prefix
	if (!secret.startsWith('whsec_')) {
		return false;
	}

	// Check if remaining part is valid hex (32 characters)
	const hexPart = secret.substring(6);
	return /^[0-9a-f]{32}$/.test(hexPart);
}

/**
 * Generate webhook signature using HMAC-SHA256
 * Signature is computed over: payload + timestamp
 * @param {string} payload - Webhook payload (JSON string)
 * @param {string} timestamp - ISO 8601 timestamp string
 * @param {string} secret - Webhook secret
 * @returns {string} - HMAC-SHA256 signature in hex format
 */
export function generateWebhookSignature(payload, timestamp, secret) {
	if (!payload || typeof payload !== 'string') {
		throw new Error('Payload must be a non-empty string');
	}

	if (!timestamp || typeof timestamp !== 'string') {
		throw new Error('Timestamp must be a non-empty string');
	}

	if (!secret || typeof secret !== 'string') {
		throw new Error('Secret must be a non-empty string');
	}

	const signedContent = `${payload}${timestamp}`;

	return crypto
		.createHmac('sha256', secret)
		.update(signedContent)
		.digest('hex');
}

/**
 * Verify webhook signature by comparing calculated vs provided signature
 * Uses constant-time comparison to prevent timing attacks
 * @param {string} payload - Webhook payload (JSON string)
 * @param {string} timestamp - ISO 8601 timestamp string
 * @param {string} signature - Provided signature to verify
 * @param {string} secret - Webhook secret
 * @returns {boolean} - True if signature is valid
 */
export function verifyWebhookSignature(payload, timestamp, signature, secret) {
	if (!payload || typeof payload !== 'string') {
		return false;
	}

	if (!timestamp || typeof timestamp !== 'string') {
		return false;
	}

	if (!signature || typeof signature !== 'string') {
		return false;
	}

	if (!secret || typeof secret !== 'string') {
		return false;
	}

	try {
		const calculatedSignature = generateWebhookSignature(payload, timestamp, secret);
		// Use constant-time comparison to prevent timing attacks
		return crypto.timingSafeEqual(
			Buffer.from(calculatedSignature),
			Buffer.from(signature)
		);
	} catch (error) {
		return false;
	}
}
