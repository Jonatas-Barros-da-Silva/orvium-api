import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import { deliverWebhook } from './webhookDeliveryService.js';
import logger from '../utils/logger.js';

/**
 * Validate that an event belongs to a workspace
 * @param {string} eventId - Event ID
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<boolean>} - True if event belongs to workspace
 */
export async function validateEventOwnership(eventId, workspaceId) {
	if (!eventId || typeof eventId !== 'string') {
		throw new Error('Event ID must be a non-empty string');
	}

	if (!workspaceId || typeof workspaceId !== 'string') {
		throw new Error('Workspace ID must be a non-empty string');
	}

	const log = await pb.collection('webhook_delivery_logs').getFirstListItem(
		`event_id="${eventId}"`,
		{
			expand: 'subscription_id',
		}
	);

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
 * Get event details by event ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} - Event details {event_id, event_type, created_at}
 */
export async function getEventDetails(eventId) {
	if (!eventId || typeof eventId !== 'string') {
		throw new Error('Event ID must be a non-empty string');
	}

	const log = await pb.collection('webhook_delivery_logs').getFirstListItem(
		`event_id="${eventId}"`,
		{
			expand: 'subscription_id,subscription_id.event_type',
		}
	);

	if (!log) {
		throw new Error('Event not found');
	}

	// Extract event_type from expanded relation
	const eventTypeRecord = log.expand?.subscription_id?.[0]?.expand?.event_type?.[0];
	if (!eventTypeRecord) {
		throw new Error('Event type not found');
	}

	return {
		event_id: eventId,
		event_type: eventTypeRecord.event_name,
		created_at: log.created,
	};
}

/**
 * Replay an event to all active subscriptions
 * Finds all subscriptions matching the event type and workspace
 * Creates new log entries with trigger_type='event_replay'
 * @param {string} eventId - Event ID
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} - Result {success: boolean, eventId: string, deliveriesTriggered: number, error: null}
 */
export async function replayEvent(eventId, workspaceId) {
	if (!eventId || typeof eventId !== 'string') {
		throw new Error('Event ID must be a non-empty string');
	}

	if (!workspaceId || typeof workspaceId !== 'string') {
		throw new Error('Workspace ID must be a non-empty string');
	}

	// Validate event exists and belongs to workspace
	const isOwner = await validateEventOwnership(eventId, workspaceId);
	if (!isOwner) {
		throw new Error('Unauthorized');
	}

	// Get event details
	const eventDetails = await getEventDetails(eventId);

	// Find all active subscriptions for this event type and workspace
	const subscriptions = await pb.collection('event_subscriptions').getFullList({
		filter: `workspace_id="${workspaceId}" && event_type.event_name="${eventDetails.event_type}" && status="active"`,
		expand: 'event_type',
		$autoCancel: false,
	});

	if (subscriptions.length === 0) {
		logger.info(`No active subscriptions found for event type: ${eventDetails.event_type}`);
		return {
			success: true,
			eventId: eventDetails.event_id,
			deliveriesTriggered: 0,
			error: null,
		};
	}

	let deliveriesTriggered = 0;

	// Deliver to all subscriptions asynchronously (non-blocking)
	const deliveryPromises = subscriptions.map(async (subscription) => {
		try {
			await deliverWebhook(
				subscription,
				eventDetails.event_type,
				{},
				eventDetails.event_id,
				'event_replay'
			);

			// Create log entry with trigger_type='event_replay'
			await pb.collection('webhook_delivery_logs').create({
				subscription_id: subscription.id,
				event_id: eventDetails.event_id,
				endpoint_url: subscription.endpoint_url,
				status: 'pending',
				attempt_number: 1,
				trigger_type: 'event_replay',
				created_at: new Date().toISOString(),
			});

			deliveriesTriggered++;
		} catch (error) {
			logger.error(`Failed to replay event to ${subscription.endpoint_url}:`, error.message);
		}
	});

	// Fire and forget - don't wait for all deliveries to complete
	Promise.all(deliveryPromises).catch(error => {
		logger.error('Error in event replay:', error.message);
	});

	logger.info(`Event replay triggered for ${subscriptions.length} subscriptions`);

	return {
		success: true,
		eventId: eventDetails.event_id,
		deliveriesTriggered: subscriptions.length,
		error: null,
	};
}
