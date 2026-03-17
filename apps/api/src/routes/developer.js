
import { Router } from 'express';
import pb from '../utils/pocketbaseClient.js';
import { generateApiKey } from '../utils/apiKeyGenerator.js';
import {
  calculateMetrics,
  getRequestsByTime,
  getRequestsByEndpoint,
  getStatusCodeDistribution,
  getLatencyDistribution
} from '../services/metricsService.js';

const router = Router();

/**
 * POST /api-keys - Create new API key
 */
router.post('/api-keys', async (req, res) => {
  const { name, environment, permissions } = req.body;
  const organizationId = req.organizationId;

  if (!name || !environment) {
    throw new Error('Name and environment are required');
  }

  const apiKey = generateApiKey();
  const apiKeyId = `key_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const record = await pb.collection('api_keys').create({
    api_key_id: apiKeyId,
    organization_id: organizationId,
    description: name,
    status: 'active',
    api_key: apiKey,
    environment: environment,
    permissions: permissions || []
  }, { $autoCancel: false });

  res.json({
    success: true,
    api_key: apiKey,
    key_prefix: apiKey.substring(0, 12),
    api_key_id: record.api_key_id,
    created_at: record.created
  });
});

/**
 * GET /api-keys - List API keys
 */
router.get('/api-keys', async (req, res) => {
  const organizationId = req.organizationId;

  const keys = await pb.collection('api_keys').getFullList({
    filter: `organization_id = "${organizationId}"`,
    sort: '-created',
    $autoCancel: false
  });

  const sanitizedKeys = keys.map(key => ({
    id: key.id,
    api_key_id: key.api_key_id,
    name: key.description,
    key_prefix: key.api_key ? key.api_key.substring(0, 12) : '',
    environment: key.environment || 'live',
    permissions: key.permissions || [],
    status: key.status,
    created: key.created,
    last_used_at: key.last_used_at,
    expires_at: key.expires_at
  }));

  res.json({
    success: true,
    keys: sanitizedKeys
  });
});

/**
 * POST /api-keys/:id/revoke - Revoke API key
 */
router.post('/api-keys/:id/revoke', async (req, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId;

  const key = await pb.collection('api_keys').getFirstListItem(
    `api_key_id = "${id}" && organization_id = "${organizationId}"`,
    { $autoCancel: false }
  );

  if (!key) {
    throw new Error('API key not found');
  }

  await pb.collection('api_keys').update(key.id, {
    status: 'revoked'
  }, { $autoCancel: false });

  res.json({
    success: true,
    message: 'API key revoked successfully'
  });
});

/**
 * GET /metrics - Get usage metrics
 */
router.get('/metrics', async (req, res) => {
  const { from_date, to_date, time_period } = req.query;
  const workspaceId = req.organizationId;

  let fromDate, toDate;
  
  if (time_period === '24h') {
    toDate = new Date();
    fromDate = new Date(toDate.getTime() - 24 * 60 * 60 * 1000);
  } else if (time_period === '7d') {
    toDate = new Date();
    fromDate = new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (time_period === '30d') {
    toDate = new Date();
    fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    fromDate = new Date(from_date || new Date(Date.now() - 24 * 60 * 60 * 1000));
    toDate = new Date(to_date || new Date());
  }

  const metrics = await calculateMetrics(workspaceId, fromDate.toISOString(), toDate.toISOString());
  const requestsByTime = await getRequestsByTime(workspaceId, fromDate.toISOString(), toDate.toISOString(), time_period === '24h' ? 'hour' : 'day');
  const requestsByEndpoint = await getRequestsByEndpoint(workspaceId, fromDate.toISOString(), toDate.toISOString());
  const statusCodeDistribution = await getStatusCodeDistribution(workspaceId, fromDate.toISOString(), toDate.toISOString());
  const latencyDistribution = await getLatencyDistribution(workspaceId, fromDate.toISOString(), toDate.toISOString());

  res.json({
    success: true,
    metrics: {
      ...metrics,
      requests_by_time: requestsByTime,
      requests_by_endpoint: requestsByEndpoint.slice(0, 5),
      status_code_distribution: statusCodeDistribution,
      latency_distribution: latencyDistribution,
      top_endpoints: requestsByEndpoint.slice(0, 10)
    }
  });
});

/**
 * GET /logs - Get request logs
 */
router.get('/logs', async (req, res) => {
  const { limit = 50, offset = 0, from_date, to_date, status_code, endpoint, method, request_id } = req.query;
  const workspaceId = req.organizationId;

  let filter = `workspace_id = "${workspaceId}"`;
  
  if (from_date) filter += ` && created_at >= "${from_date}"`;
  if (to_date) filter += ` && created_at <= "${to_date}"`;
  if (status_code) filter += ` && status_code = ${status_code}`;
  if (endpoint) filter += ` && endpoint = "${endpoint}"`;
  if (method) filter += ` && method = "${method}"`;
  if (request_id) filter += ` && request_id = "${request_id}"`;

  const logs = await pb.collection('api_request_logs').getList(
    Math.floor(offset / limit) + 1,
    parseInt(limit),
    {
      filter,
      sort: '-created_at',
      $autoCancel: false
    }
  );

  res.json({
    success: true,
    total_count: logs.totalItems,
    limit: parseInt(limit),
    offset: parseInt(offset),
    logs: logs.items
  });
});

/**
 * GET /logs/:request_id - Get single log details
 */
router.get('/logs/:request_id', async (req, res) => {
  const { request_id } = req.params;
  const workspaceId = req.organizationId;

  const log = await pb.collection('api_request_logs').getFirstListItem(
    `request_id = "${request_id}" && workspace_id = "${workspaceId}"`,
    { $autoCancel: false }
  );

  if (!log) {
    throw new Error('Log not found');
  }

  res.json({
    success: true,
    log
  });
});

export default router;
