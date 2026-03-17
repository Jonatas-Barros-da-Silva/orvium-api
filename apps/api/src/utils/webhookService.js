import 'dotenv/config';
import crypto from 'crypto';
import pb from './pocketbaseClient.js';
import logger from './logger.js';

/**
 * Find webhooks for an organization and event type
 * @param {string} organizationId - Organization ID
 * @param {string} eventType - Event type
 * @returns {Promise<Array>} - Array of webhook records
 */
export async function findWebhooks(organizationId, eventType) {
	try {
		const webhooks = await pb.collection('webhooks').getFullList({
			filter: `organization_id = "${organizationId}" && event_types ~ "${eventType}" && status = "active"`,
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
export function signPayload(payload, secret) {
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
export async function sendWebhook(webhook, payload) {
	try {
		const signature = signPayload(payload, webhook.secret);
		const timestamp = new Date().toISOString();

		const response = await fetch(webhook.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Webhook-Signature': signature,
				'X-Webhook-Timestamp': timestamp,
				'X-Webhook-ID': webhook.id,
			},
			body: JSON.stringify(payload),
			timeout: 10000,
		});

		const success = response.ok;

		// Create webhook log
		const logRecord = await pb.collection('webhook_logs').create({
			webhook_id: webhook.id,
			organization_id: webhook.organization_id,
			event_type: payload.event_type,
			payload: JSON.stringify(payload),
			status_code: response.status,
			response_body: await response.text(),
			success: success,
			attempt: 1,
		});

		// Update webhook last_triggered_at
		if (success) {
			await pb.collection('webhooks').update(webhook.id, {
				last_triggered_at: timestamp,
			});
		}

		return logRecord;
	} catch (error) {
		logger.error('Error sending webhook:', error.message);

		// Create failed webhook log
		try {
			const logRecord = await pb.collection('webhook_logs').create({
				webhook_id: webhook.id,
				organization_id: webhook.organization_id,
				event_type: payload.event_type,
				payload: JSON.stringify(payload),
				status_code: 0,
				response_body: error.message,
				success: false,
				attempt: 1,
			});

			return logRecord;
		} catch (logError) {
			logger.error('Error creating webhook log:', logError.message);
			throw logError;
		}
	}
}

/**
 * Retry webhook with exponential backoff
 * @param {string} webhookLogId - Webhook log ID
 * @returns {Promise<Object>} - Updated webhook log
 */
export async function retryWebhook(webhookLogId) {
	try {
		const logRecord = await pb.collection('webhook_logs').getOne(webhookLogId);
		const webhook = await pb.collection('webhooks').getOne(logRecord.webhook_id);

		const attempt = (logRecord.attempt || 1) + 1;
		const backoffMs = Math.pow(5000, attempt - 1); // 5s, 25s, 125s

		if (attempt > 3) {
			logger.warn(`Webhook ${webhookLogId} exceeded max retry attempts`);
			return logRecord;
		}

		// Wait before retrying
		await new Promise(resolve => setTimeout(resolve, backoffMs));

		const payload = JSON.parse(logRecord.payload);
		const signature = signPayload(payload, webhook.secret);
		const timestamp = new Date().toISOString();

		const response = await fetch(webhook.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Webhook-Signature': signature,
				'X-Webhook-Timestamp': timestamp,
				'X-Webhook-ID': webhook.id,
			},
			body: JSON.stringify(payload),
			timeout: 10000,
		});

		const success = response.ok;

		const updatedLog = await pb.collection('webhook_logs').update(webhookLogId, {
			status_code: response.status,
			response_body: await response.text(),
			success: success,
			attempt: attempt,
		});

		if (success) {
			await pb.collection('webhooks').update(webhook.id, {
				last_triggered_at: timestamp,
			});
		}

		return updatedLog;
	} catch (error) {
		logger.error('Error retrying webhook:', error.message);
		throw error;
	}
}
