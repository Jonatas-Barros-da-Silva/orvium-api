
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import {
	calculateSecondsUntilReset,
	formatRateLimitHeaders,
	formatResetTime
} from '../utils/rateLimitFormatter.js';

/**
 * Error Handler Middleware for API Gateway
 * Catches all errors from gateway routes and logs them
 * Handles rate limit errors specially with proper formatting
 */
export default async (err, req, res, next) => {
	try {
		const requestId = req.requestId || 'unknown';
		const timestamp = new Date().toISOString();
		let statusCode = 500;
		let errorMessage = 'Internal server error';
		let errorType = 'internal_error';

		// Ensure X-Request-ID header is set
		if (!res.hasHeader('X-Request-ID') && req.requestId) {
			res.setHeader('X-Request-ID', req.requestId);
		}

		// Handle rate limit errors specially
		if (err.statusCode === 429 || err.type === 'rate_limit_exceeded') {
			statusCode = 429;
			errorType = 'rate_limit_exceeded';

			// Use rate limit info from error or request
			const rateLimit = err.rateLimit || req.rateLimit || {
				limit: 5000,
				remaining: 0,
				reset: Math.floor(Date.now() / 1000) + 3600,
			};

			const secondsUntilReset = calculateSecondsUntilReset(rateLimit.reset);

			// Set rate limit headers
			const headers = formatRateLimitHeaders(rateLimit);
			res.setHeader('X-RateLimit-Limit', headers['X-RateLimit-Limit']);
			res.setHeader('X-RateLimit-Remaining', '0');
			res.setHeader('X-RateLimit-Reset', headers['X-RateLimit-Reset']);
			res.setHeader('Retry-After', String(Math.max(0, secondsUntilReset)));

			logger.warn(`[${requestId}] Rate limit exceeded for API key ${req.apiKeyId}`);

			// Log to database asynchronously
			setImmediate(async () => {
				try {
					const logData = {
						request_id: requestId,
						workspace_id: req.workspaceId || null,
						api_key_id: req.apiKeyId || null,
						endpoint: req.path,
						method: req.method,
						status_code: statusCode,
						latency_ms: req.startTime ? Date.now() - req.startTime : 0,
						ip_address: req.ip || req.connection.remoteAddress || null,
						user_agent: req.headers['user-agent'] || null,
						error_message: 'Rate limit exceeded',
						request_payload_size: req.headers['content-length'] || 0,
						response_payload_size: 0,
						created_at: timestamp,
					};

					await pb.collection('api_request_logs').create(logData);
				} catch (logError) {
					logger.error('Failed to log rate limit error:', logError.message);
				}
			});

			// Return formatted rate limit error response
			return res.status(statusCode).json({
				error: {
					type: errorType,
					message: 'Rate limit exceeded',
					request_id: requestId,
					retryAfter: Math.max(0, secondsUntilReset),
					resetTime: formatResetTime(rateLimit.reset)
				}
			});
		}

		// Determine status code and message based on error type
		if (err.statusCode) {
			statusCode = err.statusCode;
			errorMessage = err.message || 'An error occurred';
		} else if (err.message) {
			// Map common error messages to status codes
			if (err.message.includes('not found') || err.message.includes('Not found')) {
				statusCode = 404;
				errorMessage = 'Resource not found';
				errorType = 'not_found';
			} else if (err.message.includes('Unauthorized')) {
				statusCode = 401;
				errorMessage = 'Unauthorized';
				errorType = 'unauthorized';
			} else if (err.message.includes('Forbidden')) {
				statusCode = 403;
				errorMessage = 'Forbidden';
				errorType = 'forbidden';
			} else if (err.message.includes('Bad request') || err.message.includes('Invalid')) {
				statusCode = 400;
				errorMessage = 'Bad request';
				errorType = 'bad_request';
			} else if (err.message.includes('Too Many Requests')) {
				statusCode = 429;
				errorMessage = 'Too many requests';
				errorType = 'rate_limit_exceeded';
			}
		}

		// Set rate limit headers for non-429 errors if available
		if (req.rateLimit && statusCode !== 429) {
			const headers = formatRateLimitHeaders(req.rateLimit);
			if (!res.hasHeader('X-RateLimit-Limit')) {
				res.setHeader('X-RateLimit-Limit', headers['X-RateLimit-Limit']);
			}
			if (!res.hasHeader('X-RateLimit-Remaining')) {
				res.setHeader('X-RateLimit-Remaining', headers['X-RateLimit-Remaining']);
			}
			if (!res.hasHeader('X-RateLimit-Reset')) {
				res.setHeader('X-RateLimit-Reset', headers['X-RateLimit-Reset']);
			}
		}

		// Log error asynchronously
		setImmediate(async () => {
			try {
				const logData = {
					request_id: requestId,
					workspace_id: req.workspaceId || null,
					api_key_id: req.apiKeyId || null,
					endpoint: req.path,
					method: req.method,
					status_code: statusCode,
					latency_ms: req.startTime ? Date.now() - req.startTime : 0,
					ip_address: req.ip || req.connection.remoteAddress || null,
					user_agent: req.headers['user-agent'] || null,
					error_message: err.message || errorMessage,
					request_payload_size: req.headers['content-length'] || 0,
					response_payload_size: 0,
					created_at: timestamp,
				};

				await pb.collection('api_request_logs').create(logData);
			} catch (logError) {
				logger.error('Failed to log error:', logError.message);
			}
		});

		// Log to console
		logger.error(`[${requestId}] ${err.message}`);

		// Return error response without exposing internal details
		res.status(statusCode).json({
			error: {
				type: errorType,
				message: statusCode === 500 ? 'Internal server error' : errorMessage,
				request_id: requestId
			}
		});
	} catch (error) {
		logger.error('Error in error handler:', error.message);
		
		if (!res.hasHeader('X-Request-ID') && req.requestId) {
			res.setHeader('X-Request-ID', req.requestId);
		}
		
		res.status(500).json({
			error: {
				type: 'internal_error',
				message: 'Internal server error',
				request_id: req.requestId || 'unknown'
			}
		});
	}
};
