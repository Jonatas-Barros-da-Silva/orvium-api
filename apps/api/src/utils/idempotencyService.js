import 'dotenv/config';
import pb from './pocketbaseClient.js';
import logger from './logger.js';

/**
 * Check if an idempotency key already exists
 * @param {string} collection - Collection name
 * @param {string} idempotencyKey - Idempotency key value
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object|null>} - Existing record or null
 */
export async function checkIdempotencyKey(collection, idempotencyKey, organizationId) {
	try {
		const records = await pb.collection('idempotency_keys').getFullList({
			filter: `idempotency_key = "${idempotencyKey}" && organization_id = "${organizationId}" && collection_name = "${collection}"`,
		});

		if (records.length > 0) {
			return records[0];
		}

		return null;
	} catch (error) {
		logger.error('Error checking idempotency key:', error.message);
		throw error;
	}
}

/**
 * Store an idempotency key
 * @param {string} collection - Collection name
 * @param {string} idempotencyKey - Idempotency key value
 * @param {string} recordId - Created record ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} - Created idempotency record
 */
export async function storeIdempotencyKey(collection, idempotencyKey, recordId, organizationId) {
	try {
		const record = await pb.collection('idempotency_keys').create({
			idempotency_key: idempotencyKey,
			collection_name: collection,
			record_id: recordId,
			organization_id: organizationId,
		});

		return record;
	} catch (error) {
		logger.error('Error storing idempotency key:', error.message);
		throw error;
	}
}
