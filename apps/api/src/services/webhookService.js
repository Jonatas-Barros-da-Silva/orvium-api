import 'dotenv/config';
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const RETRY_DELAYS = [5000, 25000, 125000]; // 5s, 25s, 125s

/**
 * Find webhooks for organization and event type
 * @param {string} organizationId - Organization ID
 * @param {string} eventType - Event type
 * @returns {Promise<Array>} - Array of webhook records
 */
async function findWebhooks(organizationId, eventType) {
	try {
		const webhooks = await pb.collection('webhooks').getFullList({
			filter: `organization_id="${organizationId}" && event_types~"${eventType}" && status="active"`,
		});
		return webhooks;
	} catch (error) {
		logger.error('Error finding webhooks:', error.message);
		return [];
	}
}

/**
 * Sign payload with HMAC-SHA256
 * @param {Object} payload - Payload to sign
 * @param {string} secret - Webhook secret
 * @returns {string} - HMAC signature
 */
function signPayload(payload, secret) {
	const payloadString = JSON.stringify(payload);
	return crypto
		.createHmac('sha256', secret)
		.update(payloadString)
		.digest('hex');
}

/**
 * Send webhook to endpoint
 * @param {Object} webhook - Webhook record
 * @param {Object} payload - Payload to send
 * @returns {Promise<Object>} - Webhook log record
 */
async function sendWebhook(webhook, payload) {
	const signature = webhook.secret ? signPayload(payload, webhook.secret) : null;
	const timestamp = new Date().toISOString();

	const headers = {
		'Content-Type': 'application/json',
	};

	if (signature) {
		headers['X-Webhook-Signature'] = `sha256=${signature}`;
	}

	headers['X-Webhook-Timestamp'] = timestamp;
	headers['X-Webhook-ID'] = webhook.id;

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

		const response = await fetch(webhook.endpoint_url, {
			method: 'POST',
			headers,
			body: JSON.stringify(payload),
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		const responseBody = await response.text();
		const success = response.ok;

		// Create webhook log
		const logRecord = await pb.collection('webhook_logs').create({
			webhook_id: webhook.id,
			organization_id: webhook.organization_id,
			event_type: payload.event_type,
			payload: JSON.stringify(payload),
			response_status: response.status,
			response_body: responseBody,
			status: success ? 'delivered' : 'failed',
			retry_attempt: 1,
		});

		// Update webhook last_triggered_at if successful
		if (success) {
			await pb.collection('webhooks').update(webhook.id, {
				last_triggered_at: timestamp,
			});
		}

		return logRecord;
	} catch (error) {
		logger.error('Error sending webhook:', error.message);

		// Create failed webhook log
		const logRecord = await pb.collection('webhook_logs').create({
			webhook_id: webhook.id,
			organization_id: webhook.organization_id,
			event_type: payload.event_type,
			payload: JSON.stringify(payload),
			response_status: 0,
			response_body: error.message,
			status: 'failed',
			retry_attempt: 1,
		});

		return logRecord;
	}
}

/**
 * Retry webhook with exponential backoff
 * @param {string} webhookLogId - Webhook log ID
 * @returns {Promise<Object>} - Updated webhook log
 */
async function retryWebhook(webhookLogId) {
	try {
		const logRecord = await pb.collection('webhook_logs').getOne(webhookLogId);
		const webhook = await pb.collection('webhooks').getOne(logRecord.webhook_id);

		const attempt = (logRecord.retry_attempt || 1) + 1;

		if (attempt > RETRY_DELAYS.length + 1) {
			logger.warn(`Webhook ${webhookLogId} exceeded max retry attempts`);
			return logRecord;
		}

		const delayMs = RETRY_DELAYS[attempt - 2]; // -2 because attempt starts at 2

		// Wait before retrying
		await new Promise(resolve => setTimeout(resolve, delayMs));

		const payload = JSON.parse(logRecord.payload);
		const signature = webhook.secret ? signPayload(payload, webhook.secret) : null;
		const timestamp = new Date().toISOString();

		const headers = {
			'Content-Type': 'application/json',
		};

		if (signature) {
			headers['X-Webhook-Signature'] = `sha256=${signature}`;
		}

		headers['X-Webhook-Timestamp'] = timestamp;
		headers['X-Webhook-ID'] = webhook.id;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000);

			const response = await fetch(webhook.endpoint_url, {
				method: 'POST',
				headers,
				body: JSON.stringify(payload),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			const responseBody = await response.text();
			const success = response.ok;

			const updatedLog = await pb.collection('webhook_logs').update(webhookLogId, {
				response_status: response.status,
				response_body: responseBody,
				status: success ? 'delivered' : 'failed',
				retry_attempt: attempt,
			});

			if (success) {
				await pb.collection('webhooks').update(webhook.id, {
					last_triggered_at: timestamp,
				});
			}

			return updatedLog;
		} catch (error) {
			logger.error('Error retrying webhook:', error.message);

			const updatedLog = await pb.collection('webhook_logs').update(webhookLogId, {
				response_status: 0,
				response_body: error.message,
				status: 'failed',
				retry_attempt: attempt,
			});

			return updatedLog;
		}
	} catch (error) {
		logger.error('Error in retryWebhook:', error.message);
		throw error;
	}
}

/**
 * Trigger webhooks for an event
 * @param {string} eventType - Event type
 * @param {Object} data - Event data
 * @param {string} organizationId - Organization ID
 */
async function trigger(eventType, data, organizationId) {
	try {
		const webhooks = await findWebhooks(organizationId, eventType);

		if (webhooks.length === 0) {
			logger.debug(`No webhooks found for event type: ${eventType}`);
			return;
		}

		const payload = {
			event_type: eventType,
			timestamp: new Date().toISOString(),
			organization_id: organizationId,
			data,
		};

		for (const webhook of webhooks) {
			try {
				await sendWebhook(webhook, payload);
			} catch (error) {
				logger.error(`Failed to send webhook ${webhook.id}:`, error.message);
			}
		}
	} catch (error) {
		logger.error('Error triggering webhooks:', error.message);
		throw error;
	}
}

export { trigger, sendWebhook, retryWebhook, findWebhooks, signPayload };
