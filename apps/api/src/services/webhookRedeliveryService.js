import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import { deliverWebhook } from './webhookDeliveryService.js';
import logger from '../utils/logger.js';

/**
 * Validate that a webhook delivery log belongs to a workspace
 * @param {string} logId - Webhook delivery log ID
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<boolean>} - True if log belongs to workspace
 */
export async function validateLogOwnership(logId, workspaceId) {
	if (!logId || typeof logId !== 'string') {
		throw new Error('Log ID must be a non-empty string');
	}

	if (!workspaceId || typeof workspaceId !== 'string') {
		throw new Error('Workspace ID must be a non-empty string');
	}

	const log = await pb.collection('webhook_delivery_logs').getOne(logId, {
		expand: 'subscription_id',
	});

	if (!log) {
		return false;
	}

	// Get subscription from expanded relation
	const subscription = log.expand?.subscription_id?.[0];

	if (!subscription) {
		return false;
	}

	return subscription.workspace_id === workspaceId;
}

/**
 * Get full webhook delivery log details with subscription information
 * @param {string} logId - Webhook delivery log ID
 * @returns {Promise<Object>} - Log entry with subscription and event_type details
 */
export async function getLogDetails(logId) {
	if (!logId || typeof logId !== 'string') {
		throw new Error('Log ID must be a non-empty string');
	}

	const log = await pb.collection('webhook_delivery_logs').getOne(logId, {
		expand: 'subscription_id,subscription_id.event_type',
	});

	if (!log) {
		throw new Error('Webhook delivery log not found');
	}

	return {
		id: log.id,
		subscription_id: log.subscription_id,
		event_id: log.event_id,
		endpoint_url: log.endpoint_url,
		status: log.status,
		attempt_number: log.attempt_number,
		response_code: log.response_code,
		response_time_ms: log.response_time_ms,
		error_message: log.error_message,
		response_body: log.response_body,
		trigger_type: log.trigger_type || 'automatic',
		created_at: log.created,
		next_retry_at: log.next_retry_at,
		subscription: log.expand?.subscription_id?.[0] || null,
		event_type: log.expand?.subscription_id?.[0]?.expand?.event_type?.[0] || null,
	};
}

/**
 * Retry webhook delivery manually
 * Creates a NEW log entry instead of overwriting the original
 * @param {string} logId - Webhook delivery log ID
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} - Result {success: boolean, logId: string, error: null}
 */
export async function retryWebhookDelivery(logId, workspaceId) {
	if (!logId || typeof logId !== 'string') {
		throw new Error('Log ID must be a non-empty string');
	}

	if (!workspaceId || typeof workspaceId !== 'string') {
		throw new Error('Workspace ID must be a non-empty string');
	}

	// Validate log exists and belongs to workspace
	const isOwner = await validateLogOwnership(logId, workspaceId);
	if (!isOwner) {
		throw new Error('Unauthorized');
	}

	// Get original log details with expanded relations
	const originalLog = await pb.collection('webhook_delivery_logs').getOne(logId, {
		expand: 'subscription_id,subscription_id.event_type',
	});

	if (!originalLog) {
		throw new Error('Webhook delivery log not found');
	}

	// Retrieve subscription details
	const subscription = await pb.collection('event_subscriptions').getOne(originalLog.subscription_id, {
		expand: 'event_type',
	});

	if (!subscription) {
		throw new Error('Webhook subscription not found');
	}

	if (subscription.status !== 'active') {
		throw new Error('Webhook subscription is not active');
	}

	// Extract event_type from expanded relation
	const eventTypeRecord = subscription.expand?.event_type?.[0];
	if (!eventTypeRecord) {
		throw new Error('Event type not found');
	}

	const eventType = eventTypeRecord.event_name;

	// Deliver webhook with manual_retry trigger type
	const result = await deliverWebhook(subscription, eventType, {}, originalLog.event_id, 'manual_retry');

	// Create NEW log entry
	const newLog = await pb.collection('webhook_delivery_logs').create({
		subscription_id: originalLog.subscription_id,
		event_id: originalLog.event_id,
		endpoint_url: originalLog.endpoint_url,
		status: 'pending',
		attempt_number: 1,
		trigger_type: 'manual_retry',
		created_at: new Date().toISOString(),
	});

	logger.info(`Manual webhook retry triggered for log ${logId}, new log: ${newLog.id}`);

	return {
		success: true,
		logId: newLog.id,
		error: null,
	};
}
