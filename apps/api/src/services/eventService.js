import 'dotenv/config';
import crypto from 'crypto';
import { dispatchEvent } from './webhookDispatcherService.js';
import { integrationDispatcher } from '../integrations/index.js';
import { automationEngine } from '../automations/engine/automationEngine.js';
import logger from '../utils/logger.js';

/**
 * Create an event and dispatch webhooks
 * @param {string} eventType - Event type
 * @param {Object} eventData - Event data
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} - Event object {event_id, event_type, workspace_id, data, created_at}
 */
export async function createEvent(eventType, eventData, workspaceId) {
	if (!eventType || typeof eventType !== 'string') {
		throw new Error('Event type must be a non-empty string');
	}

	if (!eventData || typeof eventData !== 'object') {
		throw new Error('Event data must be a non-empty object');
	}

	if (!workspaceId || typeof workspaceId !== 'string') {
		throw new Error('Workspace ID must be a non-empty string');
	}

	// Generate event ID in format 'evt_{hex}'
	const eventId = `evt_${crypto.randomBytes(6).toString('hex')}`;
	const createdAt = new Date().toISOString();

	const event = {
		event_id: eventId,
		event_type: eventType,
		workspace_id: workspaceId,
		data: eventData,
		created_at: createdAt,
	};

	// Dispatch webhooks asynchronously (non-blocking)
	setImmediate(async () => {
		try {
			await dispatchEvent(eventType, eventData, workspaceId, eventId);
		} catch (error) {
			logger.error('Error dispatching webhooks:', error.message);
		}
	});

	// Dispatch to integrations asynchronously (non-blocking)
	Promise.resolve().then(() => {
		if (integrationDispatcher) {
			integrationDispatcher.dispatchIntegrationEvent(eventType, eventData, workspaceId).catch(
				error => {
				logger.error('Error dispatching integration event:', error.message);
			}
		);
		}
	});

	// Dispatch to automation engine asynchronously (non-blocking)
	Promise.resolve().then(() => {
		if (automationEngine) {
			automationEngine.processEvent(eventType, eventData, workspaceId).catch(
				error => {
				logger.error('Error processing automation event:', error.message);
			}
		);
		}
	});

	return event;
}
