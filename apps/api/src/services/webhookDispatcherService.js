import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import { deliverWebhook } from './webhookDeliveryService.js';
import logger from '../utils/logger.js';

/**
 * Find active webhook subscriptions for event type and workspace
 * @param {string} eventType - Event type to filter by
 * @param {string} workspaceId - Workspace ID to filter by
 * @returns {Promise<Array>} - Array of subscription records
 */
export async function findSubscriptions(eventType, workspaceId) {
	if (!eventType || typeof eventType !== 'string') {
		throw new Error('Event type must be a non-empty string');
	}

	if (!workspaceId || typeof workspaceId !== 'string') {
		throw new Error('Workspace ID must be a non-empty string');
	}

	const subscriptions = await pb.collection('event_subscriptions').getFullList({
		filter: `event_type.event_name="${eventType}" && workspace_id="${workspaceId}" && status="active"`,
		$autoCancel: false,
	});

	return subscriptions;
}

/**
 * Handle webhook delivery failure
 * @param {string} logId - Webhook delivery log ID
 * @param {string} subscriptionId - Subscription ID
 * @param {string} eventId - Event ID
 * @param {string} endpoint - Endpoint URL
 * @param {number} attempt - Current attempt number
 * @returns {Promise<void>}
 */
export async function handleWebhookFailure(logId, subscriptionId, eventId, endpoint, attempt) {
	if (!logId || typeof logId !== 'string') {
		throw new Error('Log ID must be a non-empty string');
	}

	if (typeof attempt !== 'number' || attempt < 1) {
		throw new Error('Attempt must be a positive number');
	}

	if (attempt < 10) {
		// Schedule retry
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

		await pb.collection('webhook_delivery_logs').update(logId, {
			status: 'retrying',
			next_retry_at: nextRetryAt,
		});

		logger.info(`Webhook retry scheduled for attempt ${attempt + 1}`);
	} else {
		// Mark as failed after max attempts
		await pb.collection('webhook_delivery_logs').update(logId, {
			status: 'failed',
		});

		logger.warn(`Webhook delivery failed after ${attempt} attempts`);
	}
}

/**
 * Dispatch event to all active subscriptions
 * @param {string} eventType - Event type
 * @param {Object} eventData - Event data
 * @param {string} workspaceId - Workspace ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} - Dispatch result {dispatched, failed}
 */
export async function dispatchEvent(eventType, eventData, workspaceId, eventId) {
	if (!eventType || typeof eventType !== 'string') {
		throw new Error('Event type must be a non-empty string');
	}

	if (!eventData || typeof eventData !== 'object') {
		throw new Error('Event data must be a non-empty object');
	}

	if (!workspaceId || typeof workspaceId !== 'string') {
		throw new Error('Workspace ID must be a non-empty string');
	}

	if (!eventId || typeof eventId !== 'string') {
		throw new Error('Event ID must be a non-empty string');
	}

	const subscriptions = await findSubscriptions(eventType, workspaceId);

	if (subscriptions.length === 0) {
		logger.debug(`No subscriptions found for event type: ${eventType}`);
		return { dispatched: 0, failed: 0 };
	}

	let dispatched = 0;
	let failed = 0;

	// Deliver to all subscriptions asynchronously (non-blocking)
	const deliveryPromises = subscriptions.map(async (subscription) => {
		try {
			const result = await deliverWebhook(subscription, eventType, eventData, eventId);
			if (result.success) {
				dispatched++;
			} else {
				failed++;
			}
		} catch (error) {
			logger.error(`Failed to deliver webhook to ${subscription.endpoint_url}:`, error.message);
			failed++;
		}
	});

	// Fire and forget - don't wait for all deliveries to complete
	Promise.all(deliveryPromises).catch(error => {
		logger.error('Error in webhook dispatch:', error.message);
	});

	return { dispatched: subscriptions.length, failed: 0 };
}
