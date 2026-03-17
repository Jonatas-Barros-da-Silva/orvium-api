import logger from './logger.js';

/**
 * Calculate seconds until reset timestamp
 * @param {number} resetTimestamp - Unix timestamp in seconds
 * @returns {number} - Seconds until reset (minimum 0)
 */
export function calculateSecondsUntilReset(resetTimestamp) {
	const now = Math.floor(Date.now() / 1000);
	const secondsUntilReset = resetTimestamp - now;
	return Math.max(0, secondsUntilReset);
}

/**
 * Format reset timestamp to ISO 8601 date string
 * @param {number} resetTimestamp - Unix timestamp in seconds
 * @returns {string} - ISO 8601 formatted date string
 */
export function formatResetTime(resetTimestamp) {
	return new Date(resetTimestamp * 1000).toISOString();
}

/**
 * Format rate limit information as response headers
 * @param {Object} rateLimit - Rate limit object with limit, remaining, reset
 * @returns {Object} - Object with X-RateLimit-* header key-value pairs
 */
export function formatRateLimitHeaders(rateLimit) {
	if (!rateLimit || typeof rateLimit !== 'object') {
		logger.warn('Invalid rateLimit object passed to formatRateLimitHeaders');
		return {
			'X-RateLimit-Limit': '5000',
			'X-RateLimit-Remaining': '0',
			'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600),
		};
	}

	return {
		'X-RateLimit-Limit': String(rateLimit.limit || 5000),
		'X-RateLimit-Remaining': String(Math.max(0, rateLimit.remaining || 0)),
		'X-RateLimit-Reset': String(rateLimit.reset || Math.floor(Date.now() / 1000) + 3600),
	};
}

/**
 * Format rate limit exceeded error response
 * @param {Object} rateLimit - Rate limit object with limit, remaining, reset
 * @returns {Object} - Formatted error response object
 */
export function formatRateLimitExceededResponse(rateLimit) {
	if (!rateLimit || typeof rateLimit !== 'object') {
		logger.warn('Invalid rateLimit object passed to formatRateLimitExceededResponse');
		const defaultReset = Math.floor(Date.now() / 1000) + 3600;
		return {
			error: {
				type: 'rate_limit_exceeded',
				message: 'Rate limit exceeded. Please retry after the reset time.',
				retryAfter: 3600,
				resetTime: formatResetTime(defaultReset),
			},
		};
	}

	const secondsUntilReset = calculateSecondsUntilReset(rateLimit.reset);
	const resetTime = formatResetTime(rateLimit.reset);

	return {
		error: {
			type: 'rate_limit_exceeded',
			message: 'Rate limit exceeded. Please retry after the reset time.',
			retryAfter: secondsUntilReset,
			resetTime,
		},
	};
}
