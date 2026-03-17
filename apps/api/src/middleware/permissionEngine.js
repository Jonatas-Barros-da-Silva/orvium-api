import logger from '../utils/logger.js';

/**
 * Check if a permission exists in the permissions array
 * @param {Array<string>} permissions - Array of permissions
 * @param {string} requiredPermission - Permission to check
 * @returns {boolean} - True if permission exists
 */
export function hasPermission(permissions, requiredPermission) {
	if (!Array.isArray(permissions)) {
		return false;
	}

	if (!requiredPermission || typeof requiredPermission !== 'string') {
		return false;
	}

	// Check for exact permission match
	if (permissions.includes(requiredPermission)) {
		return true;
	}

	// Check for webhook permissions
	const webhookPermissions = ['webhook.create', 'webhook.read', 'webhook.write', 'webhook.delete'];
	if (webhookPermissions.includes(requiredPermission)) {
		return permissions.includes(requiredPermission);
	}

	// Check for integration permissions
	const integrationPermissions = ['integration.read', 'integration.write'];
	if (integrationPermissions.includes(requiredPermission)) {
		return permissions.includes(requiredPermission);
	}

	// Check for integration config permissions
	const integrationConfigPermissions = ['integration.config.read', 'integration.config.write'];
	if (integrationConfigPermissions.includes(requiredPermission)) {
		return permissions.includes(requiredPermission);
	}

	// Check for automation permissions
	const automationPermissions = ['automation.read', 'automation.write'];
	if (automationPermissions.includes(requiredPermission)) {
		return permissions.includes(requiredPermission);
	}

	// Check for admin marketplace permissions
	const adminPermissions = ['admin.marketplace'];
	if (adminPermissions.includes(requiredPermission)) {
		return permissions.includes(requiredPermission);
	}

	return false;
}

/**
 * Middleware factory that requires a specific permission
 * @param {string} requiredPermission - Permission to require (e.g., 'event.create')
 * @returns {Function} - Express middleware function
 */
export function requirePermission(requiredPermission) {
	return (req, res, next) => {
		const userPermissions = req.permissions || [];

		if (!hasPermission(userPermissions, requiredPermission)) {
			logger.warn(
				`Permission denied for API key ${req.apiKeyId}: required '${requiredPermission}', has [${userPermissions.join(', ')}]`
			);

			return res.status(403).json({
				error: 'Forbidden',
				message: `Forbidden - requires ${requiredPermission} permission`,
			});
		}

		next();
	};
}
