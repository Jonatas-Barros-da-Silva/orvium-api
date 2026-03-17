import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import { deliverWebhook } from './webhookDeliveryService.js';
import { handleWebhookFailure } from './webhookDispatcherService.js';
import logger from '../utils/logger.js';

let retrySchedulerInterval = null;
let cleanupSchedulerInterval = null;

/**
 * Process a single webhook retry
 * @param {Object} logRecord - Webhook delivery log record
 * @returns {Promise<void>}
 */
async function processRetry(logRecord) {
	if (!logRecord || typeof logRecord !== 'object') {
		throw new Error('Log record must be a non-empty object');
	}

	// Retrieve subscription
	const subscription = await pb.collection('event_subscriptions').getOne(logRecord.subscription_id);

	if (!subscription) {
		logger.warn(`Subscription not found: ${logRecord.subscription_id}`);
		await pb.collection('webhook_delivery_logs').update(logRecord.id, {
			status: 'failed',
		});
		return;
	}

	// Check if subscription is still active
	if (subscription.status !== 'active') {
		logger.info(`Subscription is not active: ${logRecord.subscription_id}`);
		await pb.collection('webhook_delivery_logs').update(logRecord.id, {
			status: 'failed',
		});
		return;
	}

	// Parse event data
	const eventData = logRecord.event_data ? JSON.parse(logRecord.event_data) : {};
	const newAttempt = (logRecord.attempt_number || 1) + 1;

	// Retry delivery
	const result = await deliverWebhook(subscription, logRecord.event_type, eventData, logRecord.event_id);

	if (!result.success && newAttempt < 10) {
		// Schedule next retry
		await handleWebhookFailure(
			logRecord.id,
			logRecord.subscription_id,
			logRecord.event_id,
			logRecord.endpoint_url,
			newAttempt
		);
	} else if (!result.success) {
		// Mark as failed after max attempts
		await pb.collection('webhook_delivery_logs').update(logRecord.id, {
			status: 'failed',
		});
	}
}

/**
 * Clean up old webhook delivery logs (older than 90 days)
 * @returns {Promise<void>}
 */
async function cleanupOldLogs() {
	const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

	const oldLogs = await pb.collection('webhook_delivery_logs').getFullList({
		filter: `created < "${ninetyDaysAgo}"`,
		$autoCancel: false,
	});

	if (oldLogs.length === 0) {
		return;
	}

	// Delete in batches to avoid overwhelming the database
	const batchSize = 100;
	for (let i = 0; i < oldLogs.length; i += batchSize) {
		const batch = oldLogs.slice(i, i + batchSize);
		const deletePromises = batch.map(log =>
			pb.collection('webhook_delivery_logs').delete(log.id).catch(err => {
				logger.error(`Error deleting log ${log.id}:`, err.message);
			})
		);
		await Promise.all(deletePromises);
	}

	logger.info(`Cleaned up ${oldLogs.length} old webhook delivery logs`);
}

/**
 * Process pending retries
 * @returns {Promise<void>}
 */
async function processPendingRetries() {
	const now = new Date().toISOString();

	const logsToRetry = await pb.collection('webhook_delivery_logs').getFullList({
		filter: `status="retrying" && next_retry_at<="${now}"`,
		sort: 'next_retry_at',
		$autoCancel: false,
	});

	if (logsToRetry.length > 0) {
		logger.debug(`Processing ${logsToRetry.length} webhook retries`);

		// Process retries in parallel (max 5 concurrent)
		const batchSize = 5;
		for (let i = 0; i < logsToRetry.length; i += batchSize) {
			const batch = logsToRetry.slice(i, i + batchSize);
			const retryPromises = batch.map(log => processRetry(log).catch(err => {
				logger.error(`Error processing retry for log ${log.id}:`, err.message);
			}));
			await Promise.all(retryPromises);
		}
	}
}

/**
 * Start the webhook retry scheduler
 * Runs every 30 seconds to check for retries
 * Runs cleanup daily
 * @returns {void}
 */
export function startRetryScheduler() {
	logger.info('Webhook retry scheduler started');

	// Run retry processor every 30 seconds
	retrySchedulerInterval = setInterval(async () => {
		try {
			await processPendingRetries();
		} catch (error) {
			logger.error('Error in webhook retry scheduler:', error.message);
		}
	}, 30000);

	// Run cleanup daily (86400000 ms = 24 hours)
	cleanupSchedulerInterval = setInterval(async () => {
		try {
			await cleanupOldLogs();
		} catch (error) {
			logger.error('Error in webhook cleanup scheduler:', error.message);
		}
	}, 86400000);
}

/**
 * Stop the webhook retry scheduler
 * @returns {void}
 */
export function stopRetryScheduler() {
	if (retrySchedulerInterval) {
		clearInterval(retrySchedulerInterval);
	}
	if (cleanupSchedulerInterval) {
		clearInterval(cleanupSchedulerInterval);
	}
	logger.info('Webhook retry scheduler stopped');
}
