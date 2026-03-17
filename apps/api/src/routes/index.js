import { Router } from 'express';
import pb from '../utils/pocketbaseClient.js';
import healthCheck from './health-check.js';
import eventsRouter from './events.js';
import walletRouter from './wallet.js';
import payoutsRouter from './payouts.js';
import transactionsRouter from './transactions.js';
import developerRouter from './developer.js';
import webhooksRouter from './webhooks.js';
import createIntegrationRoutes from './integrations.js';
import integrationConfigsRouter from './integrationConfigs.js';
import automationRulesRouter from './automationRules.js';
import automationLogsRouter from './automationLogs.js';
import automationTemplatesRouter from './automationTemplates.js';
import marketplaceRouter from './marketplace.js';
import workspaceIntegrationsRouter from './workspaceIntegrations.js';
import integrationHealthRouter from './integrationHealth.js';
import oauthRouter from './oauth.js';
import marketplaceAdminRouter from './admin/marketplaceAdmin.js';
import { apiKeyAuth, requestLogger, rateLimiter } from '../middleware/index.js';

const router = Router();

export default () => {
	// Health check endpoint (no auth required)
	router.get('/health', healthCheck);

	// Marketplace endpoints (no auth required)
	router.use('/marketplace', marketplaceRouter);

	// OAuth endpoints (auth required)
	router.use('/integrations/oauth', oauthRouter);

	// Apply middleware to all protected routes
	router.use(requestLogger);
	router.use(apiKeyAuth);
	router.use(rateLimiter);

	// Protected routes
	router.post('/events', eventsRouter);
	router.get('/wallet/balance', walletRouter);
	router.get('/wallet/transactions', walletRouter);
	router.post('/payouts', payoutsRouter);
	router.use('/transactions', transactionsRouter);
	router.use('/developer', developerRouter);
	router.use('/webhooks', webhooksRouter);
	
	// Integration routes - create router with pb instance
	const integrationsRouter = createIntegrationRoutes(pb);
	router.use('/integrations', integrationsRouter);
	
	router.use('/integrations/configs', integrationConfigsRouter);
	router.use('/automations/rules', automationRulesRouter);
	router.use('/automations/logs', automationLogsRouter);
	router.use('/automation/templates', automationTemplatesRouter);
	router.use('/workspaces', workspaceIntegrationsRouter);
	router.use('/workspaces', integrationHealthRouter);
	router.use('/admin/marketplace', marketplaceAdminRouter);

	return router;
};
