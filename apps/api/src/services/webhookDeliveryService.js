import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import { generateWebhookSignature } from '../utils/webhookSecretGenerator.js';
import logger from '../utils/logger.js';

/**
 * Create webhook payload as JSON string
 * @param {string} eventType - Event type
 * @param {Object} eventData - Event data
 * @param {string} eventId - Event ID
 * @returns {string} - JSON string with {event_id, event_type, timestamp, data}
 */
export function createWebhookPayload(eventType, eventData, eventId) {
	if (!eventType || typeof eventType !== 'string') {
		throw new Error('Event type must be a non-empty string');
	}

	if (!eventData || typeof eventData !== 'object') {
		throw new Error('Event data must be a non-empty object');
	}

	if (!eventId || typeof eventId !== 'string') {
		throw new Error('Event ID must be a non-empty string');
	}

	const payload = {
		event_id: eventId,
		event_type: eventType,
		timestamp: new Date().toISOString(),
		data: eventData,
	};

	return JSON.stringify(payload);
}

/**
 * Send webhook request to endpoint
 * @param {string} endpoint - Webhook endpoint URL
 * @param {string} payload - Webhook payload (JSON string)
 * @param {string} signature - HMAC signature
 * @param {string} timestamp - ISO 8601 timestamp
 * @param {string} eventType - Event type
 * @returns {Promise<Object>} - Response with {success, statusCode, responseTime, error}
 */
export async function sendWebhookRequest(endpoint, payload, signature, timestamp, eventType) {
	if (!endpoint || typeof endpoint !== 'string') {
		throw new Error('Endpoint must be a non-empty string');
	}

	if (!payload || typeof payload !== 'string') {
		throw new Error('Payload must be a non-empty string');
	}

	if (!signature || typeof signature !== 'string') {
		throw new Error('Signature must be a non-empty string');
	}

	if (!timestamp || typeof timestamp !== 'string') {
		throw new Error('Timestamp must be a non-empty string');
	}

	if (!eventType || typeof eventType !== 'string') {
		throw new Error('Event type must be a non-empty string');
	}

	const startTime = Date.now();

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Orvium-Event': eventType,
			'X-Orvium-Timestamp': timestamp,
			'X-Orvium-Signature': signature,
		},
		body: payload,
		signal: controller.signal,
	});

	clearTimeout(timeoutId);

	const responseTime = Date.now() - startTime;
	const body = await response.text();

	return {
		success: response.ok,
		statusCode: response.status,
		responseTime,
		error: null,
		body,
	};
}

/**
 * Log webhook delivery attempt
 * @param {string} subscriptionId - Webhook subscription ID
 * @param {string} eventId - Event ID
 * @param {string} endpoint - Webhook endpoint URL
 * @param {string} status - Delivery status ('delivered' or 'failed')
 * @param {number} attempt - Attempt number
 * @param {Object} response - Response object {success, statusCode, responseTime, error, body}
 * @param {string} triggerType - Trigger type ('automatic', 'manual_retry', 'event_replay')
 * @returns {Promise<Object>} - Created log record
 */
export async function logWebhookDelivery(subscriptionId, eventId, endpoint, status, attempt, response, triggerType = 'automatic') {
	if (!subscriptionId || typeof subscriptionId !== 'string') {
		throw new Error('Subscription ID must be a non-empty string');
	}

	if (!eventId || typeof eventId !== 'string') {
		throw new Error('Event ID must be a non-empty string');
	}

	if (!endpoint || typeof endpoint !== 'string') {
		throw new Error('Endpoint must be a non-empty string');
	}

	if (!status || typeof status !== 'string') {
		throw new Error('Status must be a non-empty string');
	}

	if (typeof attempt !== 'number' || attempt < 1) {
		throw new Error('Attempt must be a positive number');
	}

	if (!response || typeof response !== 'object') {
		throw new Error('Response must be a non-empty object');
	}

	if (!triggerType || typeof triggerType !== 'string') {
		triggerType = 'automatic';
	}

	const logRecord = await pb.collection('webhook_delivery_logs').create({
		subscription_id: subscriptionId,
		event_id: eventId,
		endpoint_url: endpoint,
		status,
		attempt_number: attempt,
		response_code: response.statusCode || 0,
		response_time_ms: response.responseTime || 0,
		error_message: response.error || null,
		response_body: response.body || '',
		trigger_type: triggerType,
	});

	return logRecord;
}

/**
 * Schedule webhook retry with exponential backoff
 * Retry delays: 1min, 5min, 30min, 2h, 12h, 24h for attempts 1-6
 * @param {string} logId - Webhook delivery log ID
 * @param {string} subscriptionId - Webhook subscription ID
 * @param {string} eventId - Event ID
 * @param {string} endpoint - Webhook endpoint URL
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} - Updated log record
 */
export async function scheduleWebhookRetry(logId, subscriptionId, eventId, endpoint, attempt) {
	if (!logId || typeof logId !== 'string') {
		throw new Error('Log ID must be a non-empty string');
	}

	if (typeof attempt !== 'number' || attempt < 1) {
		throw new Error('Attempt must be a positive number');
	}

	// Retry delays in milliseconds: 1min, 5min, 30min, 2h, 12h, 24h
	const retryDelays = [
		60 * 1000,        // 1 minute
		5 * 60 * 1000,    // 5 minutes
		30 * 60 * 1000,   // 30 minutes
		2 * 60 * 60 * 1000,  // 2 hours
		12 * 60 * 60 * 1000, // 12 hours
		24 * 60 * 60 * 1000, // 24 hours
	];

	const delayMs = retryDelays[attempt - 1] || retryDelays[retryDelays.length - 1];
	const nextRetryAt = new Date(Date.now() + delayMs).toISOString();

	const updatedLog = await pb.collection('webhook_delivery_logs').update(logId, {
		status: 'retrying',
		next_retry_at: nextRetryAt,
	});

	return updatedLog;
}

/**
 * Deliver webhook to subscription endpoint
 * @param {Object} subscription - Webhook subscription record
 * @param {string} eventType - Event type
 * @param {Object} eventData - Event data
 * @param {string} eventId - Event ID
 * @param {string} triggerType - Trigger type ('automatic', 'manual_retry', 'event_replay')
 * @returns {Promise<Object>} - Delivery result {success, statusCode, responseTime, error}
 */
export async function deliverWebhook(subscription, eventType, eventData, eventId, triggerType = 'automatic') {
	if (!subscription || typeof subscription !== 'object') {
		throw new Error('Subscription must be a non-empty object');
	}

	if (!eventType || typeof eventType !== 'string') {
		throw new Error('Event type must be a non-empty string');
	}

	if (!eventData || typeof eventData !== 'object') {
		throw new Error('Event data must be a non-empty object');
	}

	if (!eventId || typeof eventId !== 'string') {
		throw new Error('Event ID must be a non-empty string');
	}

	if (!triggerType || typeof triggerType !== 'string') {
		triggerType = 'automatic';
	}

	const timestamp = new Date().toISOString();
	const attempt = 1;

	// Create payload
	const payload = createWebhookPayload(eventType, eventData, eventId);

	// Generate signature
	const signature = generateWebhookSignature(payload, timestamp, subscription.secret);

	// Send request
	const response = await sendWebhookRequest(subscription.endpoint_url, payload, signature, timestamp, eventType);

	// Determine status
	const status = response.success ? 'delivered' : 'failed';

	// Log delivery
	const logRecord = await logWebhookDelivery(
		subscription.id,
		eventId,
		subscription.endpoint_url,
		status,
		attempt,
		response,
		triggerType
	);

	// Schedule retry if failed and attempt < 10
	if (!response.success && attempt < 10) {
		await scheduleWebhookRetry(
			logRecord.id,
			subscription.id,
			eventId,
			subscription.endpoint_url,
			attempt
		);
	}

	return {
		success: response.success,
		statusCode: response.statusCode,
		responseTime: response.responseTime,
		error: response.error,
	};
}
