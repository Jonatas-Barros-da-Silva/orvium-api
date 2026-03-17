import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

export default (req, res, next) => {
	const startTime = Date.now();
	let requestPayload = null;
	let responsePayload = null;
	let errorMessage = null;

	// Capture request payload (sanitized)
	if (req.method !== 'GET' && req.body) {
		try {
			requestPayload = JSON.stringify(req.body);
		} catch (e) {
			requestPayload = '[Unable to serialize request body]';
		}
	}

	// Intercept response.json()
	const originalJson = res.json.bind(res);
	res.json = function(data) {
		try {
			responsePayload = JSON.stringify(data);
		} catch (e) {
			responsePayload = '[Unable to serialize response body]';
		}
		return originalJson(data);
	};

	// Intercept response.send()
	const originalSend = res.send.bind(res);
	res.send = function(data) {
		if (res.statusCode >= 400) {
			try {
				errorMessage = typeof data === 'string' ? data : JSON.stringify(data);
			} catch (e) {
				errorMessage = '[Unable to serialize error]';
			}
		}
		return originalSend(data);
	};

	// Log on response finish
	res.on('finish', async () => {
		try {
			const logData = {
				organization_id: req.organizationId || null,
				api_key_id: req.apiKeyId || null,
				method: req.method,
				endpoint: req.path,
				ip_address: req.ip || req.connection.remoteAddress || null,
				user_agent: req.headers['user-agent'] || null,
				request_payload: requestPayload,
				status_code: res.statusCode,
				response_payload: responsePayload,
				error_message: errorMessage,
				response_time_ms: Date.now() - startTime,
			};

			await pb.collection('api_logs').create(logData);
		} catch (error) {
			logger.error('Failed to log API request:', error.message);
		}
	});

	next();
};
