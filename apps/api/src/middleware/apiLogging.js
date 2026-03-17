import logger from '../utils/logger.js';
import pb from '../utils/pocketbaseClient.js';

export default async (req, res, next) => {
	const startTime = Date.now();
	let requestPayload = null;
	let responsePayload = null;
	let errorMessage = null;

	// Capture request payload
	if (req.method !== 'GET' && req.body) {
		requestPayload = JSON.stringify(req.body);
	}

	// Intercept response
	const originalJson = res.json.bind(res);
	res.json = function(data) {
		responsePayload = JSON.stringify(data);
		return originalJson(data);
	};

	// Intercept errors
	const originalSend = res.send.bind(res);
	res.send = function(data) {
		if (res.statusCode >= 400) {
			errorMessage = typeof data === 'string' ? data : JSON.stringify(data);
		}
		return originalSend(data);
	};

	res.on('finish', async () => {
		try {
			const logData = {
				method: req.method,
				endpoint: req.path,
				status_code: res.statusCode,
				request_payload: requestPayload,
				response_payload: responsePayload,
				error_message: errorMessage,
				ip_address: req.ip || req.connection.remoteAddress,
				user_agent: req.headers['user-agent'] || null,
				organization_id: req.organizationId || null,
				api_key_id: req.apiKey?.id || null,
				response_time_ms: Date.now() - startTime,
			};

			await pb.collection('api_logs').create(logData);
		} catch (error) {
			logger.error('Failed to log API request:', error.message);
		}
	});

	next();
};
