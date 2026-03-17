
import pb from '../utils/pocketbaseClient.js';
import { generateRequestId } from '../utils/requestIdGenerator.js';
import logger from '../utils/logger.js';

/**
 * Request Logging Gateway Middleware
 * Generates request ID, captures request/response metadata, and logs to database
 */
export default (req, res, next) => {
	const requestId = generateRequestId();
	const startTime = Date.now();

	// Attach request ID and start time to request
	req.requestId = requestId;
	req.startTime = startTime;

	// Set request ID in response header immediately
	res.setHeader('X-Request-ID', requestId);

	// Log on response finish
	res.on('finish', async () => {
		try {
			const latencyMs = Date.now() - startTime;
			const responsePayloadSize = res.getHeader('content-length') || 0;
			const requestPayloadSize = req.headers['content-length'] || 0;

			const logData = {
				request_id: requestId,
				workspace_id: req.workspaceId || null,
				api_key_id: req.apiKeyId || null,
				endpoint: req.path,
				method: req.method,
				status_code: res.statusCode,
				latency_ms: latencyMs,
				ip_address: req.ip || req.connection.remoteAddress || null,
				user_agent: req.headers['user-agent'] || null,
				error_message: req.errorMessage || null,
				request_payload_size: parseInt(requestPayloadSize, 10) || 0,
				response_payload_size: parseInt(responsePayloadSize, 10) || 0,
				created_at: new Date().toISOString(),
			};

			// Log asynchronously
			setImmediate(async () => {
				try {
					await pb.collection('api_request_logs').create(logData);
				} catch (error) {
					logger.error('Failed to log API request:', error.message);
				}
			});
		} catch (error) {
			logger.error('Error in request logging middleware:', error.message);
		}
	});

	next();
};
