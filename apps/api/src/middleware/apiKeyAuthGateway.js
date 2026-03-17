import pb from '../utils/pocketbaseClient.js';
import { hashApiKey, validateKeyFormat } from '../utils/apiKeyGenerator.js';
import logger from '../utils/logger.js';

/**
 * API Key Authentication Gateway Middleware
 * Extracts x-api-key header, validates it, and attaches metadata to request
 */
export default async (req, res, next) => {
	const apiKey = req.headers['x-api-key'];

	// Validate header exists
	if (!apiKey) {
		return res.status(401).json({
			error: 'Unauthorized',
			message: 'Missing x-api-key header',
		});
	}

	// Validate key format
	if (!validateKeyFormat(apiKey)) {
		return res.status(401).json({
			error: 'Unauthorized',
			message: 'Invalid API key format',
		});
	}

	// Hash the key
	let keyHash;
	try {
		keyHash = hashApiKey(apiKey);
	} catch (error) {
		logger.error('Error hashing API key:', error.message);
		return res.status(401).json({
			error: 'Unauthorized',
			message: 'Invalid API key',
		});
	}

	// Query database for API key
	let apiKeyRecord;
	try {
		apiKeyRecord = await pb.collection('api_keys').getFirstListItem(`key_hash="${keyHash}"`);
	} catch (error) {
		logger.warn(`API key not found: ${keyHash}`);
		return res.status(401).json({
			error: 'Unauthorized',
			message: 'Invalid API key',
		});
	}

	// Validate status is active
	if (apiKeyRecord.status !== 'active') {
		logger.warn(`API key inactive: ${apiKeyRecord.id}`);
		return res.status(401).json({
			error: 'Unauthorized',
			message: 'API key is inactive',
		});
	}

	// Validate not revoked
	if (apiKeyRecord.revoked_at) {
		logger.warn(`API key revoked: ${apiKeyRecord.id}`);
		return res.status(401).json({
			error: 'Unauthorized',
			message: 'API key has been revoked',
		});
	}

	// Update last_used_at timestamp
	try {
		await pb.collection('api_keys').update(apiKeyRecord.id, {
			last_used_at: new Date().toISOString(),
		});
	} catch (error) {
		logger.error('Error updating last_used_at:', error.message);
		// Don't fail the request if we can't update the timestamp
	}

	// Attach metadata to request
	req.apiKey = apiKeyRecord;
	req.workspaceId = apiKeyRecord.workspace_id;
	req.apiKeyId = apiKeyRecord.id;
	req.permissions = apiKeyRecord.permissions || [];
	req.environment = apiKeyRecord.environment || 'unknown';

	next();
};
