import express from 'express';
import crypto from 'crypto';
import { marketplaceService } from '../services/marketplaceService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// In-memory state store with 10 minute expiry
const stateStore = new Map();

// Cleanup old states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      stateStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

/**
 * GET /integrations/oauth/start - Start OAuth flow
 * Query params: integrationId, provider
 */
router.get('/start', async (req, res) => {
  const { integrationId, provider } = req.query;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    const err = new Error('Workspace ID is required');
    err.status = 401;
    throw err;
  }

  if (!integrationId || typeof integrationId !== 'string') {
    const err = new Error('integrationId is required and must be a string');
    err.status = 400;
    throw err;
  }

  // Validate integrationId UUID format
  if (!marketplaceService.validateUUID(integrationId)) {
    const err = new Error('Invalid integration ID format');
    err.status = 400;
    throw err;
  }

  if (!provider || typeof provider !== 'string') {
    const err = new Error('provider is required and must be a string');
    err.status = 400;
    throw err;
  }

  // Get workspace integration
  const integration = await marketplaceService.getWorkspaceIntegration(workspaceId, integrationId);

  if (!integration) {
    const err = new Error('Integration not found');
    err.status = 404;
    throw err;
  }

  // Get OAuth provider config from environment
  const clientId = process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`];
  const redirectUri = process.env[`OAUTH_${provider.toUpperCase()}_REDIRECT_URI`];
  const authEndpoint = process.env[`OAUTH_${provider.toUpperCase()}_AUTH_ENDPOINT`];

  if (!clientId || !redirectUri || !authEndpoint) {
    const err = new Error(`OAuth provider ${provider} is not configured`);
    err.status = 400;
    throw err;
  }

  // Generate state token
  const state = crypto.randomBytes(32).toString('hex');

  // Store state with integration info
  stateStore.set(state, {
    integrationId,
    workspaceId,
    provider,
    createdAt: Date.now(),
  });

  // Build authorization URL
  const authUrl = new URL(authEndpoint);
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'openid profile email');

  res.json({
    authUrl: authUrl.toString(),
  });
});

/**
 * GET /integrations/oauth/callback - OAuth callback
 * Query params: code, state, error
 */
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    const err = new Error(error);
    err.status = 400;
    throw err;
  }

  if (!state || typeof state !== 'string') {
    const err = new Error('state parameter is required');
    err.status = 400;
    throw err;
  }

  // Validate state token
  const stateData = stateStore.get(state);
  if (!stateData) {
    const err = new Error('Invalid state token');
    err.status = 401;
    throw err;
  }

  // Remove state from store
  stateStore.delete(state);

  if (!code || typeof code !== 'string') {
    const err = new Error('code parameter is required');
    err.status = 400;
    throw err;
  }

  const { integrationId, workspaceId, provider } = stateData;

  // Get OAuth provider config
  const clientId = process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_SECRET`];
  const redirectUri = process.env[`OAUTH_${provider.toUpperCase()}_REDIRECT_URI`];
  const tokenEndpoint = process.env[`OAUTH_${provider.toUpperCase()}_TOKEN_ENDPOINT`];

  if (!clientId || !clientSecret || !redirectUri || !tokenEndpoint) {
    const err = new Error(`OAuth provider ${provider} is not configured`);
    err.status = 400;
    throw err;
  }

  // Exchange code for access token
  const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const err = new Error('Failed to exchange authorization code for access token');
    err.status = 400;
    throw err;
  }

  const tokenData = await tokenResponse.json();

  // Create OAuth connection record
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  const oauthConnection = await marketplaceService.createOAuthConnection(
    integrationId,
    provider,
    tokenData.access_token,
    tokenData.refresh_token || null,
    expiresAt,
    tokenData.scope || 'openid profile email'
  );

  logger.info(`OAuth connection created: workspace=${workspaceId}, integration=${integrationId}, provider=${provider}`);

  res.json({
    success: true,
    message: 'OAuth connection established',
    oauth_connection_id: oauthConnection.id,
  });
});

export default router;
