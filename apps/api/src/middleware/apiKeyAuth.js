import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

export default async (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Missing or invalid Authorization header' });
	}

	const apiKey = authHeader.substring(7);

	let apiKeyRecord;
	try {
		apiKeyRecord = await pb.collection('api_keys').getFirstListItem(`api_key="${apiKey}"`);
	} catch (error) {
		logger.warn(`API key not found: ${apiKey}`);
		throw new Error('Invalid API key');
	}

	// Validate status is active
	if (apiKeyRecord.status !== 'active') {
		throw new Error('API key is not active');
	}

	// Validate expiration
	if (apiKeyRecord.expires_at) {
		const expiresAt = new Date(apiKeyRecord.expires_at);
		if (expiresAt <= new Date()) {
			throw new Error('API key has expired');
		}
	}

	// Update last_used_at timestamp
	await pb.collection('api_keys').update(apiKeyRecord.id, {
		last_used_at: new Date().toISOString(),
	});

	// Attach to request
	req.apiKey = apiKeyRecord;
	req.organizationId = apiKeyRecord.organization_id;
	req.apiKeyId = apiKeyRecord.id;

	next();
};
