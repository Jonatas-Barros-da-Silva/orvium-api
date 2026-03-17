import logger from '../utils/logger.js';

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
const RATE_LIMIT_MAX = 1000; // requests per hour
const CLEANUP_INTERVAL = 600000; // cleanup every 10 minutes

// Cleanup old entries periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, data] of rateLimitStore.entries()) {
		if (now - data.resetTime > RATE_LIMIT_WINDOW) {
			rateLimitStore.delete(key);
		}
	}
}, CLEANUP_INTERVAL);

export default (req, res, next) => {
	// Skip rate limiting if no API key (will be caught by auth middleware)
	if (!req.apiKeyId) {
		return next();
	}

	const apiKeyId = req.apiKeyId;
	const now = Date.now();

	if (!rateLimitStore.has(apiKeyId)) {
		rateLimitStore.set(apiKeyId, {
			count: 1,
			resetTime: now,
		});
		const resetTime = new Date(now + RATE_LIMIT_WINDOW);
		res.set('X-RateLimit-Limit', '1000');
		res.set('X-RateLimit-Remaining', '999');
		res.set('X-RateLimit-Reset', resetTime.toISOString());
		return next();
	}

	const data = rateLimitStore.get(apiKeyId);

	// Check if window has expired
	if (now - data.resetTime > RATE_LIMIT_WINDOW) {
		data.count = 1;
		data.resetTime = now;
		const resetTime = new Date(now + RATE_LIMIT_WINDOW);
		res.set('X-RateLimit-Limit', '1000');
		res.set('X-RateLimit-Remaining', '999');
		res.set('X-RateLimit-Reset', resetTime.toISOString());
		return next();
	}

	// Check if limit exceeded
	if (data.count >= RATE_LIMIT_MAX) {
		const resetTime = new Date(data.resetTime + RATE_LIMIT_WINDOW);
		res.set('X-RateLimit-Limit', '1000');
		res.set('X-RateLimit-Remaining', '0');
		res.set('X-RateLimit-Reset', resetTime.toISOString());
		return res.status(429).json({
			error: 'Too Many Requests',
			message: `Rate limit exceeded. Max ${RATE_LIMIT_MAX} requests per hour.`,
			retryAfter: Math.ceil((data.resetTime + RATE_LIMIT_WINDOW - now) / 1000),
			resetTime: resetTime.toISOString(),
		});
	}

	data.count++;
	const remaining = RATE_LIMIT_MAX - data.count;
	const resetTime = new Date(data.resetTime + RATE_LIMIT_WINDOW);
	res.set('X-RateLimit-Limit', '1000');
	res.set('X-RateLimit-Remaining', remaining.toString());
	res.set('X-RateLimit-Reset', resetTime.toISOString());
	next();
};
