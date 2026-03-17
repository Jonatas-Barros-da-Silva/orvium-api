
import logger from '../utils/logger.js';
import { calculateSecondsUntilReset } from '../utils/rateLimitFormatter.js';

/**
 * Response Interceptor Middleware
 * Ensures X-RateLimit-* and X-Request-ID headers are always set
 * Sets Retry-After header for 429 responses
 */
export default (req, res, next) => {
	// Intercept response finish to ensure headers are set
	res.on('finish', () => {
		try {
			// Ensure X-Request-ID is always present
			if (!res.hasHeader('X-Request-ID')) {
				if (req.requestId) {
					res.setHeader('X-Request-ID', req.requestId);
				} else {
					logger.warn('X-Request-ID header missing and req.requestId is not set');
				}
			}

			// Only set rate limit headers if rateLimit info exists
			if (req.rateLimit && typeof req.rateLimit === 'object') {
				// Set headers if not already set
				if (!res.hasHeader('X-RateLimit-Limit')) {
					res.setHeader('X-RateLimit-Limit', String(req.rateLimit.limit || 5000));
				}
				if (!res.hasHeader('X-RateLimit-Remaining')) {
					res.setHeader('X-RateLimit-Remaining', String(Math.max(0, req.rateLimit.remaining || 0)));
				}
				if (!res.hasHeader('X-RateLimit-Reset')) {
					res.setHeader('X-RateLimit-Reset', String(req.rateLimit.reset || Math.floor(Date.now() / 1000) + 3600));
				}

				// Set Retry-After header for 429 responses
				if (res.statusCode === 429 && !res.hasHeader('Retry-After')) {
					const secondsUntilReset = calculateSecondsUntilReset(req.rateLimit.reset);
					res.setHeader('Retry-After', String(Math.max(0, secondsUntilReset)));
				}
			}
		} catch (error) {
			logger.error('Error in response interceptor:', error.message);
		}
	});

	next();
};
