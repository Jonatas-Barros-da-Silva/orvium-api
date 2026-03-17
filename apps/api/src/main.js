
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import pb from './utils/pocketbaseClient.js';
import routes from './routes/index.js';
import { setupIntegrationTestRoutes } from './routes/integrations-test.js';
import createIntegrationRoutes from './routes/integrations.js';
import createDeveloperRoutes from './routes/developers.js';
import createReviewRoutes from './routes/reviews.js';
import createConfigurationRoutes from './routes/configurations.js';
import createAnalyticsRoutes from './routes/analytics.js';
import createLogsRoutes from './routes/logs.js';
import createTracesRoutes from './routes/traces.js';
import createExecutionIORoutes from './routes/execution-io.js';
import createReplayRoutes from './routes/replay.js';
import createRuntimeRoutes from './routes/runtime.js';
import createManifestRoutes from './routes/manifest.js';
import { validateRuntimeConfig } from './config/runtime.config.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
// Increase payload limit for manifest uploads
app.use(express.json({ limit: '10mb' }));

/*
 * ⚠️ IMPORTANT: Schema migrations are NOT run automatically during startup. 
 * Migrations must be executed manually using: node scripts/run-migrations.js
 * This ensures the API runtime never modifies the database schema unexpectedly.
 * See: apps/api/src/database/migrations/README.md
 */

// Validate runtime configuration on startup
validateRuntimeConfig();

// Safe on-demand loading for WAVE 21 integration services
global.integrationServices = null;
global.getIntegrationServices = async function(pbInstance) {
  if (global.integrationServices) {
    return global.integrationServices;
  }
  try {
    // Dynamically import to avoid startup crashes if files have issues
    const { IntegrationRegistryService } = await import('./modules/integrations/services/IntegrationRegistryService.js');
    const { IntegrationVersionService } = await import('./modules/integrations/services/IntegrationVersionService.js');
    const { IntegrationInstallationService } = await import('./modules/integrations/services/IntegrationInstallationService.js');
    const { IntegrationResolver } = await import('./modules/integrations/resolvers/IntegrationResolver.js');

    global.integrationServices = {
      registry: new IntegrationRegistryService(),
      version: new IntegrationVersionService(),
      installation: new IntegrationInstallationService(),
      resolver: new IntegrationResolver()
    };
    return global.integrationServices;
  } catch (error) {
    console.warn('Failed to initialize integration services on-demand:', error.message);
    return null;
  }
};

// Mount API routes
app.use('/api', routes);

// Register integration marketplace routes
const integrationsRouter = createIntegrationRoutes(pb);
app.use('/api/integrations', integrationsRouter);

// Register developer routes
const developersRouter = createDeveloperRoutes(pb);
app.use('/api/developers', developersRouter);

// Register review routes
const reviewsRouter = createReviewRoutes(pb);
app.use('/api/reviews', reviewsRouter);

// Register configuration routes
const configurationsRouter = createConfigurationRoutes(pb);
app.use('/api', configurationsRouter);

// Register analytics routes
const analyticsRouter = createAnalyticsRoutes(pb);
app.use(['/analytics', '/api/analytics'], analyticsRouter);

// Register logs routes
const logsRouter = createLogsRoutes(pb);
app.use('/api/logs', logsRouter);

// Register traces routes
const tracesRouter = createTracesRoutes(pb);
app.use('/api/traces', tracesRouter);

// Register execution IO routes
const executionIORouter = createExecutionIORoutes(pb);
app.use('/api/executions', executionIORouter);

// Register replay routes
const replayRouter = createReplayRoutes(pb);
app.use('/api', replayRouter);

// Register runtime metrics routes
const runtimeRouter = createRuntimeRoutes();
app.use('/api/runtime', runtimeRouter);

// Register manifest routes
const manifestRouter = createManifestRoutes();
app.use('/api/manifest', manifestRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

// POST health check route
app.post('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

// Register integration test routes
setupIntegrationTestRoutes(app, pb);

// Error handling middleware (must be registered after all routes)
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    status
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
