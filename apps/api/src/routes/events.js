import { Router } from 'express';
import { randomUUID } from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import { trigger } from '../services/webhookService.js';
import { replayEvent } from '../services/eventReplayService.js';
import logger from '../utils/logger.js';

const router = Router();

const VALID_EVENT_TYPES = [
	'PROCEDURE_EXECUTED',
	'PROCEDURE_CANCELLED',
	'PROCEDURE_REFUNDED',
	'FINANCIAL_ADJUSTMENT',
	'PAYOUT_CREATED',
	'PAYOUT_COMPLETED',
];

router.post('/events', async (req, res) => {
	const {
		professional_id,
		procedure_id,
		event_type,
		gross_amount,
		description,
	} = req.body;

	const idempotencyKey = req.headers['idempotency-key'];

	// Validate required fields
	if (!professional_id || !procedure_id || !event_type || gross_amount === undefined) {
		return res.status(400).json({ error: 'Missing required fields: professional_id, procedure_id, event_type, gross_amount' });
	}

	// Validate event_type
	if (!VALID_EVENT_TYPES.includes(event_type)) {
		return res.status(400).json({ error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` });
	}

	// Validate gross_amount is positive
	if (typeof gross_amount !== 'number' || gross_amount <= 0) {
		return res.status(400).json({ error: 'gross_amount must be a positive number' });
	}

	// Check idempotency key
	if (idempotencyKey) {
		try {
			const existingEvent = await pb.collection('financial_events').getFirstListItem(
				`idempotency_key="${idempotencyKey}" && organization_id="${req.organizationId}"`
			);
			return res.status(201).json({
				id: existingEvent.id,
				event_id: existingEvent.event_id,
				organization_id: existingEvent.organization_id,
				professional_id: existingEvent.professional_id,
				procedure_id: existingEvent.procedure_id,
				event_type: existingEvent.event_type,
				gross_amount: existingEvent.gross_amount,
				description: existingEvent.description,
				status: existingEvent.status,
				event_date: existingEvent.event_date,
				created_at: existingEvent.created_at,
				idempotent: true,
			});
		} catch (error) {
			// Key doesn't exist, continue with creation
		}
	}

	// Verify professional exists and belongs to organization
	let professional;
	try {
		professional = await pb.collection('professionals').getOne(professional_id);
		if (professional.organization_id !== req.organizationId) {
			throw new Error('Professional does not belong to this organization');
		}
	} catch (error) {
		if (error.message.includes('does not belong')) {
			return res.status(403).json({ error: 'Professional does not belong to this organization' });
		}
		throw new Error('Professional not found');
	}

	// Verify procedure exists and belongs to organization
	let procedure;
	try {
		procedure = await pb.collection('procedures').getOne(procedure_id);
		if (procedure.organization_id !== req.organizationId) {
			throw new Error('Procedure does not belong to this organization');
		}
	} catch (error) {
		if (error.message.includes('does not belong')) {
			return res.status(403).json({ error: 'Procedure does not belong to this organization' });
		}
		throw new Error('Procedure not found');
	}

	// Create financial event
	const eventId = randomUUID();
	const today = new Date().toISOString().split('T')[0];

	const eventRecord = await pb.collection('financial_events').create({
		event_id: eventId,
		organization_id: req.organizationId,
		professional_id,
		procedure_id,
		event_type,
		gross_amount,
		description: description || null,
		status: 'created',
		idempotency_key: idempotencyKey || null,
		event_date: today,
	});

	// Trigger webhook asynchronously
	setImmediate(async () => {
		try {
			await trigger('event.created', {
				event_id: eventRecord.event_id,
				professional_id,
				procedure_id,
				event_type,
				gross_amount,
				description,
			}, req.organizationId);
		} catch (error) {
			logger.error('Webhook trigger failed:', error.message);
		}
	});

	res.status(201).json({
		id: eventRecord.id,
		event_id: eventRecord.event_id,
		organization_id: eventRecord.organization_id,
		professional_id: eventRecord.professional_id,
		procedure_id: eventRecord.procedure_id,
		event_type: eventRecord.event_type,
		gross_amount: eventRecord.gross_amount,
		description: eventRecord.description,
		status: eventRecord.status,
		event_date: eventRecord.event_date,
		created_at: eventRecord.created_at,
	});
});

/**
 * POST /events/:event_id/replay - Replay an event to all active subscriptions
 */
router.post('/:event_id/replay', async (req, res) => {
	const { event_id } = req.params;
	const workspaceId = req.workspaceId;
	const requestId = req.requestId;

	if (!workspaceId) {
		throw new Error('Workspace ID is required');
	}

	const result = await replayEvent(event_id, workspaceId);

	res.json({
		status: 'event_replayed',
		event_id: result.eventId,
		deliveries_triggered: result.deliveriesTriggered,
		request_id: requestId,
	});
});

export default router;
