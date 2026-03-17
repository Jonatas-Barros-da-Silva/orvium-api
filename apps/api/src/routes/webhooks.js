import express from 'express';
import { randomUUID } from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import { generateWebhookSecret } from '../utils/webhookSecretGenerator.js';
import { retryWebhookDelivery } from '../services/webhookRedeliveryService.js';
import { replayEvent } from '../services/eventReplayService.js';
import logger from '../utils/logger.js';

const router = express.Router();

const VALID_EVENT_TYPES = [
	'event.created',
	'event.updated',
	'event.deleted',
	'payout.created',
	'payout.completed',
	'payout.failed',
	'wallet.updated',
	'transaction.created',
];

/**
 * POST /webhooks/subscriptions - Create new webhook subscription
 */
router.post('/subscriptions', async (req, res) => {
	const { endpoint_url, event_types, description } = req.body;
	const workspaceId = req.workspaceId;

	if (!endpoint_url || typeof endpoint_url !== 'string') {
		return res.status(400).json({ error: 'endpoint_url is required and must be a string' });
	}

	if (!event_types || !Array.isArray(event_types) || event_types.length === 0) {
		return res.status(400).json({ error: 'event_types is required and must be a non-empty array' });
	}

	// Validate endpoint is HTTPS
	if (!endpoint_url.startsWith('https://')) {
		return res.status(400).json({ error: 'endpoint_url must use HTTPS protocol' });
	}

	// Validate event types
	for (const eventType of event_types) {
		if (!VALID_EVENT_TYPES.includes(eventType)) {
			return res.status(400).json({
				error: `Invalid event_type: ${eventType}. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
			});
		}
	}

	// Validate URL format
	try {
		new URL(endpoint_url);
	} catch (error) {
		return res.status(400).json({ error: 'endpoint_url must be a valid URL' });
	}

	const subscriptionId = randomUUID();
	const secret = generateWebhookSecret();

	const subscription = await pb.collection('event_subscriptions').create({
		subscription_id: subscriptionId,
		workspace_id: workspaceId,
		endpoint_url,
		event_types,
		secret,
		description: description || null,
		status: 'active',
	});

	res.status(201).json({
		id: subscription.id,
		subscription_id: subscription.subscription_id,
		endpoint_url: subscription.endpoint_url,
		event_types: subscription.event_types,
		secret: subscription.secret,
		description: subscription.description,
		status: subscription.status,
		created_at: subscription.created,
	});
});

/**
 * GET /webhooks/subscriptions - List webhook subscriptions for workspace
 */
router.get('/subscriptions', async (req, res) => {
	const { limit = '50', offset = '0', status } = req.query;
	const workspaceId = req.workspaceId;

	const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
	const parsedOffset = parseInt(offset, 10) || 0;

	if (parsedLimit < 1 || parsedOffset < 0) {
		return res.status(400).json({ error: 'Invalid limit or offset' });
	}

	let filter = `workspace_id="${workspaceId}"`;
	if (status) {
		filter += ` && status="${status}"`;
	}

	const subscriptions = await pb.collection('event_subscriptions').getList(
		Math.floor(parsedOffset / parsedLimit) + 1,
		parsedLimit,
		{
			filter,
			sort: '-created',
			$autoCancel: false,
		}
	);

	res.json({
		total_count: subscriptions.totalItems,
		limit: parsedLimit,
		offset: parsedOffset,
		subscriptions: subscriptions.items.map(sub => ({
			id: sub.id,
			subscription_id: sub.subscription_id,
			endpoint_url: sub.endpoint_url,
			event_types: sub.event_types,
			description: sub.description,
			status: sub.status,
			created_at: sub.created,
		})),
	});
});

/**
 * GET /webhooks/subscriptions/:id - Get webhook subscription details
 */
router.get('/subscriptions/:id', async (req, res) => {
	const { id } = req.params;
	const workspaceId = req.workspaceId;

	const subscription = await pb.collection('event_subscriptions').getOne(id);

	if (subscription.workspace_id !== workspaceId) {
		return res.status(403).json({ error: 'Subscription does not belong to this workspace' });
	}

	res.json({
		id: subscription.id,
		subscription_id: subscription.subscription_id,
		endpoint_url: subscription.endpoint_url,
		event_types: subscription.event_types,
		description: subscription.description,
		status: subscription.status,
		created_at: subscription.created,
	});
});

/**
 * POST /webhooks/subscriptions/:id/rotate-secret - Rotate webhook secret
 */
router.post('/subscriptions/:id/rotate-secret', async (req, res) => {
	const { id } = req.params;
	const workspaceId = req.workspaceId;

	const subscription = await pb.collection('event_subscriptions').getOne(id);

	if (subscription.workspace_id !== workspaceId) {
		return res.status(403).json({ error: 'Subscription does not belong to this workspace' });
	}

	const newSecret = generateWebhookSecret();

	const updated = await pb.collection('event_subscriptions').update(id, {
		secret: newSecret,
	});

	res.json({
		id: updated.id,
		subscription_id: updated.subscription_id,
		secret: updated.secret,
		message: 'Secret rotated successfully',
	});
});

/**
 * POST /webhooks/subscriptions/:id/disable - Disable webhook subscription
 */
router.post('/subscriptions/:id/disable', async (req, res) => {
	const { id } = req.params;
	const workspaceId = req.workspaceId;

	const subscription = await pb.collection('event_subscriptions').getOne(id);

	if (subscription.workspace_id !== workspaceId) {
		return res.status(403).json({ error: 'Subscription does not belong to this workspace' });
	}

	const updated = await pb.collection('event_subscriptions').update(id, {
		status: 'disabled',
	});

	res.json({
		id: updated.id,
		subscription_id: updated.subscription_id,
		status: updated.status,
		message: 'Subscription disabled',
	});
});

/**
 * POST /webhooks/subscriptions/:id/enable - Enable webhook subscription
 */
router.post('/subscriptions/:id/enable', async (req, res) => {
	const { id } = req.params;
	const workspaceId = req.workspaceId;

	const subscription = await pb.collection('event_subscriptions').getOne(id);

	if (subscription.workspace_id !== workspaceId) {
		return res.status(403).json({ error: 'Subscription does not belong to this workspace' });
	}

	const updated = await pb.collection('event_subscriptions').update(id, {
		status: 'active',
	});

	res.json({
		id: updated.id,
		subscription_id: updated.subscription_id,
		status: updated.status,
		message: 'Subscription enabled',
	});
});

/**
 * DELETE /webhooks/subscriptions/:id - Delete webhook subscription
 */
router.delete('/subscriptions/:id', async (req, res) => {
	const { id } = req.params;
	const workspaceId = req.workspaceId;

	const subscription = await pb.collection('event_subscriptions').getOne(id);

	if (subscription.workspace_id !== workspaceId) {
		return res.status(403).json({ error: 'Subscription does not belong to this workspace' });
	}

	await pb.collection('event_subscriptions').delete(id);

	res.json({
		message: 'Subscription deleted successfully',
		subscription_id: subscription.subscription_id,
	});
});

/**
 * GET /webhooks/logs - List webhook delivery logs
 */
router.get('/logs', async (req, res) => {
	const { subscription_id, event_id, status, limit = '50', offset = '0' } = req.query;
	const workspaceId = req.workspaceId;

	const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
	const parsedOffset = parseInt(offset, 10) || 0;

	if (parsedLimit < 1 || parsedOffset < 0) {
		return res.status(400).json({ error: 'Invalid limit or offset' });
	}

	// Build filter - need to verify subscription belongs to workspace
	let filter = '';

	if (subscription_id) {
		// Verify subscription belongs to workspace
		const subscription = await pb.collection('event_subscriptions').getOne(subscription_id);
		if (subscription.workspace_id !== workspaceId) {
			return res.status(403).json({ error: 'Subscription does not belong to this workspace' });
		}
		filter = `subscription_id="${subscription_id}"`;
	}

	if (event_id) {
		filter += (filter ? ' && ' : '') + `event_id="${event_id}"`;
	}

	if (status) {
		filter += (filter ? ' && ' : '') + `status="${status}"`;
	}

	const logs = await pb.collection('webhook_delivery_logs').getList(
		Math.floor(parsedOffset / parsedLimit) + 1,
		parsedLimit,
		{
			filter,
			sort: '-created',
			$autoCancel: false,
		}
	);

	res.json({
		total_count: logs.totalItems,
		limit: parsedLimit,
		offset: parsedOffset,
		logs: logs.items.map(log => ({
			id: log.id,
			subscription_id: log.subscription_id,
			event_id: log.event_id,
			endpoint_url: log.endpoint_url,
			status: log.status,
			attempt_number: log.attempt_number,
			response_code: log.response_code,
			response_time_ms: log.response_time_ms,
			trigger_type: log.trigger_type || 'automatic',
			created_at: log.created,
			next_retry_at: log.next_retry_at,
		})),
	});
});

/**
 * GET /webhooks/logs/:id - Get webhook delivery log details
 */
router.get('/logs/:id', async (req, res) => {
	const { id } = req.params;
	const workspaceId = req.workspaceId;

	const log = await pb.collection('webhook_delivery_logs').getOne(id);

	// Verify subscription belongs to workspace
	const subscription = await pb.collection('event_subscriptions').getOne(log.subscription_id);
	if (subscription.workspace_id !== workspaceId) {
		return res.status(403).json({ error: 'Log does not belong to this workspace' });
	}

	res.json({
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
	});
});

/**
 * POST /webhooks/logs/:id/retry - Manually retry a webhook delivery
 */
router.post('/logs/:id/retry', async (req, res) => {
	const { id } = req.params;
	const requestId = req.requestId;

	// Validate authentication
	if (!req.auth) {
		throw new Error('Unauthorized');
	}

	const workspaceId = req.auth.organization_id;

	if (!workspaceId) {
		throw new Error('Workspace ID is required');
	}

	const result = await retryWebhookDelivery(id, workspaceId);

	res.json({
		status: 'retry_triggered',
		log_id: id,
		request_id: requestId,
	});
});

/**
 * POST /webhooks/events/:event_id/replay - Replay an event to all active subscriptions
 */
router.post('/events/:event_id/replay', async (req, res) => {
	const { event_id } = req.params;
	const requestId = req.requestId;

	// Validate authentication
	if (!req.auth) {
		throw new Error('Unauthorized');
	}

	const workspaceId = req.auth.organization_id;

	if (!workspaceId) {
		throw new Error('Workspace ID is required');
	}

	const result = await replayEvent(event_id, workspaceId);

	res.json({
		status: 'event_replayed',
		event_id: event_id,
		deliveries_triggered: result.deliveriesTriggered,
		request_id: requestId,
	});
});

/**
 * GET /webhooks/event-types - List all available event types
 */
router.get('/event-types', async (req, res) => {
	res.json({
		event_types: VALID_EVENT_TYPES,
	});
});

export default router;
