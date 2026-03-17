
import logger from '../utils/logger.js';
import {
	calculateSecondsUntilReset,
	formatResetTime,
	formatRateLimitHeaders
} from '../utils/rateLimitFormatter.js';

const WORKSPACE_LIMIT = 10000; // requests per hour
const API_KEY_LIMIT = 5000; // requests per hour
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const CLEANUP_INTERVAL = 600000; // cleanup every 10 minutes

const rateLimitStore = new Map();

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
	const now = Math.floor(Date.now() / 1000);
	for (const [key, data] of rateLimitStore.entries()) {
		if (now - data.resetTime > RATE_LIMIT_WINDOW) {
			rateLimitStore.delete(key);
		}
	}
}, CLEANUP_INTERVAL);

/**
 * Rate Limiting Gateway Middleware
 * Implements per-workspace and per-API-key rate limiting
 * Calculates and attaches rate limit information to req.rateLimit BEFORE checking limits
 */
export default (req, res, next) => {
	// Skip rate limiting if no API key (will be caught by auth middleware)
	if (!req.apiKeyId || !req.workspaceId) {
		return next();
	}

	const now = Math.floor(Date.now() / 1000);
	const workspaceKey = `${req.workspaceId}:workspace`;
	const apiKeyKey = `${req.workspaceId}:${req.apiKeyId}`;

	// Initialize or retrieve workspace rate limit data
	if (!rateLimitStore.has(workspaceKey)) {
		rateLimitStore.set(workspaceKey, {
			count: 0,
			resetTime: now,
		});
	}

	// Initialize or retrieve API key rate limit data
	if (!rateLimitStore.has(apiKeyKey)) {
		rateLimitStore.set(apiKeyKey, {
			count: 0,
			resetTime: now,
		});
	}

	const workspaceData = rateLimitStore.get(workspaceKey);
	const apiKeyData = rateLimitStore.get(apiKeyKey);

	// Reset workspace window if expired
	if (now - workspaceData.resetTime > RATE_LIMIT_WINDOW) {
		workspaceData.count = 0;
		workspaceData.resetTime = now;
	}

	// Reset API key window if expired
	if (now - apiKeyData.resetTime > RATE_LIMIT_WINDOW) {
		apiKeyData.count = 0;
		apiKeyData.resetTime = now;
	}

	// Calculate reset timestamp (use the later of the two windows)
	const resetTimestamp = Math.max(workspaceData.resetTime, apiKeyData.resetTime) + RATE_LIMIT_WINDOW;

	// Calculate remaining requests (use the minimum of the two limits)
	const workspaceRemaining = Math.max(0, WORKSPACE_LIMIT - workspaceData.count);
	const apiKeyRemaining = Math.max(0, API_KEY_LIMIT - apiKeyData.count);
	const remaining = Math.min(workspaceRemaining, apiKeyRemaining);

	// Attach rate limit information to request BEFORE checking if limit exceeded
	req.rateLimit = {
		limit: API_KEY_LIMIT,
		remaining,
		reset: resetTimestamp,
		resetDate: formatResetTime(resetTimestamp),
	};

	// Set rate limit headers for all responses
	const headers = formatRateLimitHeaders(req.rateLimit);
	res.setHeader('X-RateLimit-Limit', headers['X-RateLimit-Limit']);
	res.setHeader('X-RateLimit-Remaining', headers['X-RateLimit-Remaining']);
	res.setHeader('X-RateLimit-Reset', headers['X-RateLimit-Reset']);

	// Ensure X-Request-ID is set before returning 429
	if (!res.hasHeader('X-Request-ID') && req.requestId) {
		res.setHeader('X-Request-ID', req.requestId);
	}

	// Check workspace limit
	if (workspaceData.count >= WORKSPACE_LIMIT) {
		logger.warn(`Workspace rate limit exceeded: ${req.workspaceId}`);

		const secondsUntilReset = calculateSecondsUntilReset(resetTimestamp);
		res.setHeader('Retry-After', String(secondsUntilReset));

		return res.status(429).json({
			error: {
				type: 'rate_limit_exceeded',
				message: `Workspace rate limit exceeded. Max ${WORKSPACE_LIMIT} requests per hour.`,
				request_id: req.requestId || 'unknown',
				retryAfter: secondsUntilReset,
				resetTime: formatResetTime(resetTimestamp)
			}
		});
	}

	// Check API key limit
	if (apiKeyData.count >= API_KEY_LIMIT) {
		logger.warn(`API key rate limit exceeded: ${req.apiKeyId}`);

		const secondsUntilReset = calculateSecondsUntilReset(resetTimestamp);
		res.setHeader('Retry-After', String(secondsUntilReset));

		return res.status(429).json({
			error: {
				type: 'rate_limit_exceeded',
				message: `API key rate limit exceeded. Max ${API_KEY_LIMIT} requests per hour.`,
				request_id: req.requestId || 'unknown',
				retryAfter: secondsUntilReset,
				resetTime: formatResetTime(resetTimestamp)
			}
		});
	}

	// Increment counters
	workspaceData.count++;
	apiKeyData.count++;

	next();
};
