
import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { integrationConfigService } from './integrationConfigService.js';
import { marketplaceService } from './marketplaceService.js';
import { executionContextService } from './executionContextService.js';
import { idempotencyService } from './idempotencyService.js';
import { permissionEngine } from './permissionEngine.js';
import { circuitBreakerService } from './circuitBreakerService.js';
import { rateLimitingService } from './rateLimitingService.js';
import { tokenEncryptionService } from './tokenEncryptionService.js';

/**
 * Integration Dispatcher
 * Dispatches events to registered adapters with full 9-step execution flow
 */
export default class IntegrationDispatcher {
  /**
   * Constructor
   * @param {AdapterRegistry} registry - Adapter registry instance
   */
  constructor(registry) {
    if (!registry) {
      throw new Error('Registry must be provided');
    }
    this.registry = registry;
  }

  /**
   * Dispatch event to all enabled adapters with 9-step execution flow
   * Step 1: Create Execution Context
   * Step 2: Generate Idempotency Key
   * Step 3: Check Idempotency (with stale processing recovery)
   * Step 4: Permission Validation
   * Step 5: Circuit Breaker
   * Step 6: Rate Limit
   * Step 7: Execute Adapter
   * Step 8: Record Success
   * Step 9: Error Handling
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   * @param {string} workspaceId - Workspace ID (UUID)
   * @returns {Promise<Object>} - Dispatch result {dispatched, failed, skipped}
   */
  async dispatchIntegrationEvent(eventType, payload, workspaceId) {
    if (!eventType || typeof eventType !== 'string') {
      throw new Error('Event type must be a non-empty string');
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be a non-empty object');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    // Validate workspaceId UUID format
    if (!marketplaceService.validateUUID(workspaceId)) {
      throw new Error('Invalid workspace ID format');
    }

    const enabledAdapters = this.registry.getEnabledAdapters();

    if (enabledAdapters.length === 0) {
      logger.debug('No enabled adapters found for integration dispatch');
      return { dispatched: 0, failed: 0, skipped: 0 };
    }

    let dispatched = 0;
    let failed = 0;
    let skipped = 0;

    // Dispatch to all adapters asynchronously (non-blocking)
    enabledAdapters.forEach(adapter => {
      Promise.resolve()
        .then(async () => {
          const adapterName = adapter.getName();
          const adapterType = adapterName;
          let executionId = null;
          let startTime = null;
          let idempotencyKey = null;
          let workspaceIntegration = null;

          try {
            // ===== STEP 1: Create Execution Context =====
            workspaceIntegration = await marketplaceService.getWorkspaceIntegrationByAdapter(
              workspaceId,
              adapterType
            );

            if (!workspaceIntegration) {
              logger.debug(`No active integration found for adapter: ${adapterType}`);
              skipped++;
              return;
            }

            if (workspaceIntegration.status === 'disabled') {
              logger.debug(`Integration is disabled: ${workspaceIntegration.id}`);
              skipped++;
              return;
            }

            const executionContext = await executionContextService.createExecutionContext(
              workspaceId,
              workspaceIntegration.id,
              adapterType,
              eventType
            );

            executionId = executionContext.execution_id;
            startTime = Date.now();

            // ===== STEP 2: Generate Idempotency Key =====
            const triggerEventId = payload.trigger_event_id || `${eventType}_${Date.now()}`;
            idempotencyKey = idempotencyService.generateIdempotencyKey(
              workspaceIntegration.id,
              triggerEventId,
              adapterType
            );

            await executionContextService.updateExecutionContext(executionId, {
              idempotency_key: idempotencyKey,
            });

            // ===== STEP 3: Check Idempotency (with stale processing recovery) =====
            const idempotencyCheck = await idempotencyService.checkIdempotency(
              idempotencyKey,
              workspaceIntegration.id
            );

            if (idempotencyCheck.exists) {
              // Check if stale processing detected
              if (idempotencyCheck.stale === true && idempotencyCheck.isStaleProcessing === true) {
                const executionTime = Date.now() - startTime;
                logger.warn(
                  `Stale processing detected for idempotency key: ${idempotencyKey}, original created at: ${idempotencyCheck.record.created}`
                );

                // Log stale processing event
                await marketplaceService.logIdempotencyEvent(
                  workspaceId,
                  workspaceIntegration.id,
                  'idempotency_stale_processing_detected',
                  {
                    idempotency_key: idempotencyKey,
                    original_created_at: idempotencyCheck.record.created,
                    original_execution_id: idempotencyCheck.record.execution_id,
                  }
                );

                // Mark old idempotency as failed
                await idempotencyService.markIdempotencyAsFailed(idempotencyKey);

                // Create new idempotency record with same key but new executionId
                await idempotencyService.createIdempotencyRecord(
                  workspaceIntegration.id,
                  idempotencyKey,
                  executionId
                );

                // Log execution as retry
                await marketplaceService.logExecution(
                  workspaceId,
                  workspaceIntegration.id,
                  adapterType,
                  'retry',
                  executionTime,
                  'Stale processing detected, retrying',
                  payload,
                  null
                );

                // Continue to next step (allow retry)
                logger.info(`Stale processing recovery initiated for integration ${workspaceIntegration.id}`);
              } else {
                // Normal duplicate - not stale
                const executionTime = Date.now() - startTime;
                logger.info(
                  `Duplicate execution prevented by idempotency check: ${idempotencyKey}`
                );

                // Get existing execution context
                const existingExecution = await executionContextService.getExecutionContext(
                  idempotencyCheck.record.execution_id
                );

                // Update current context as skipped
                await executionContextService.updateExecutionContext(executionId, {
                  status: 'skipped',
                  error_message: 'Duplicate execution prevented by idempotency check',
                  execution_time_ms: executionTime,
                });

                // Log execution as skipped
                await marketplaceService.logExecution(
                  workspaceId,
                  workspaceIntegration.id,
                  adapterType,
                  'skipped',
                  executionTime,
                  'Duplicate execution prevented',
                  payload,
                  null
                );

                skipped++;
                return {
                  success: true,
                  skipped: true,
                  reason: 'Duplicate execution prevented',
                  originalExecutionId: idempotencyCheck.record.execution_id,
                };
              }
            } else {
              // Idempotency key doesn't exist - create new record
              await idempotencyService.createIdempotencyRecord(
                workspaceIntegration.id,
                idempotencyKey,
                executionId
              );
            }

            // ===== STEP 4: Permission Validation =====
            const requiredPermissions = payload.requiredPermissions || [];
            const permissionValidation = await permissionEngine.validateIntegrationPermissions(
              workspaceIntegration,
              requiredPermissions
            );

            if (!permissionValidation.allowed) {
              const executionTime = Date.now() - startTime;
              logger.warn(
                `Permission validation failed for integration ${workspaceIntegration.id}: ${permissionValidation.missingPermissions.join(', ')}`
              );

              await executionContextService.updateExecutionContext(executionId, {
                status: 'permission_denied',
                error_message: `Missing permissions: ${permissionValidation.missingPermissions.join(', ')}`,
                execution_time_ms: executionTime,
                required_permissions: permissionValidation.requiredPermissions,
                granted_permissions: permissionValidation.grantedPermissions,
                missing_permissions: permissionValidation.missingPermissions,
              });

              await idempotencyService.updateIdempotencyStatus(idempotencyKey, 'failed');

              await marketplaceService.logExecution(
                workspaceId,
                workspaceIntegration.id,
                adapterType,
                'failed',
                executionTime,
                `Permission denied: ${permissionValidation.missingPermissions.join(', ')}`,
                payload,
                null
              );

              failed++;
              return;
            }

            // ===== STEP 5: Circuit Breaker =====
            const circuitBreakerCheck = await circuitBreakerService.canExecute(workspaceIntegration.id);

            if (!circuitBreakerCheck.allowed) {
              const executionTime = Date.now() - startTime;
              logger.warn(
                `Circuit breaker blocked execution for integration ${workspaceIntegration.id}: ${circuitBreakerCheck.reason}`
              );

              await executionContextService.updateExecutionContext(executionId, {
                status: 'circuit_breaker_open',
                error_message: circuitBreakerCheck.reason,
                execution_time_ms: executionTime,
              });

              await idempotencyService.updateIdempotencyStatus(idempotencyKey, 'failed');

              await marketplaceService.logExecution(
                workspaceId,
                workspaceIntegration.id,
                adapterType,
                'failed',
                executionTime,
                circuitBreakerCheck.reason,
                payload,
                null
              );

              skipped++;
              return;
            }

            // ===== STEP 6: Rate Limit =====
            const rateLimitCheck = await rateLimitingService.checkRateLimit(
              workspaceIntegration.id,
              executionContext
            );

            if (!rateLimitCheck.allowed) {
              const executionTime = Date.now() - startTime;
              logger.warn(
                `Rate limit exceeded for integration ${workspaceIntegration.id}: ${rateLimitCheck.reason}`
              );

              await executionContextService.updateExecutionContext(executionId, {
                status: 'rate_limited',
                error_message: rateLimitCheck.reason,
                execution_time_ms: executionTime,
              });

              await idempotencyService.updateIdempotencyStatus(idempotencyKey, 'failed');

              await marketplaceService.logExecution(
                workspaceId,
                workspaceIntegration.id,
                adapterType,
                'failed',
                executionTime,
                rateLimitCheck.reason,
                payload,
                null
              );

              failed++;
              return;
            }

            // Load adapter configuration
            const adapterConfig = await integrationConfigService.getIntegrationConfig(
              workspaceId,
              adapterName
            );

            if (!adapterConfig || !adapterConfig.enabled) {
              const executionTime = Date.now() - startTime;
              logger.debug(
                `Adapter config not found or disabled for ${adapterType} in workspace ${workspaceId}`
              );

              await executionContextService.updateExecutionContext(executionId, {
                status: 'skipped',
                error_message: 'Adapter config not found or disabled',
                execution_time_ms: executionTime,
              });

              await idempotencyService.updateIdempotencyStatus(idempotencyKey, 'failed');

              skipped++;
              return;
            }

            // Check if event is allowed by configuration
            const configJson =
              typeof adapterConfig.config_json === 'string'
                ? JSON.parse(adapterConfig.config_json)
                : adapterConfig.config_json;

            if (Array.isArray(configJson.events) && !configJson.events.includes(eventType)) {
              const executionTime = Date.now() - startTime;
              logger.debug(
                `Event type ${eventType} not in filter for adapter ${adapterType}`
              );

              await executionContextService.updateExecutionContext(executionId, {
                status: 'skipped',
                error_message: 'Event type not in filter',
                execution_time_ms: executionTime,
              });

              await idempotencyService.updateIdempotencyStatus(idempotencyKey, 'failed');

              skipped++;
              return;
            }

            // ===== STEP 7: Execute Adapter =====
            let decryptedCredentials = null;

            try {
              const oauthConnection = await marketplaceService.getOAuthConnection(
                workspaceIntegration.id
              );

              if (oauthConnection && tokenEncryptionService) {
                let accessToken = null;
                let refreshToken = null;

                if (oauthConnection.access_token_encrypted) {
                  try {
                    const accessTokenData =
                      typeof oauthConnection.access_token_encrypted === 'string'
                        ? JSON.parse(oauthConnection.access_token_encrypted)
                        : oauthConnection.access_token_encrypted;
                    accessToken = tokenEncryptionService.decryptToken(accessTokenData);
                  } catch (error) {
                    logger.warn(`Failed to decrypt access token: ${error.message}`);
                  }
                }

                if (oauthConnection.refresh_token_encrypted) {
                  try {
                    const refreshTokenData =
                      typeof oauthConnection.refresh_token_encrypted === 'string'
                        ? JSON.parse(oauthConnection.refresh_token_encrypted)
                        : oauthConnection.refresh_token_encrypted;
                    refreshToken = tokenEncryptionService.decryptToken(refreshTokenData);
                  } catch (error) {
                    logger.warn(`Failed to decrypt refresh token: ${error.message}`);
                  }
                }

                decryptedCredentials = {
                  provider: oauthConnection.provider,
                  accessToken,
                  refreshToken,
                  scopes: oauthConnection.scopes,
                  expiresAt: oauthConnection.expiresAt,
                };
              }
            } catch (error) {
              logger.warn(`Failed to get OAuth connection: ${error.message}`);
            }

            // Execute adapter
            const result = await adapter.handleEvent(
              eventType,
              payload,
              workspaceId,
              adapterConfig,
              decryptedCredentials
            );

            const executionTime = Date.now() - startTime;

            // ===== STEP 8: Record Success =====
            if (result.status === 'success') {
              await circuitBreakerService.recordSuccess(workspaceIntegration.id);
              await executionContextService.updateExecutionContext(executionId, {
                status: 'completed',
                execution_time_ms: executionTime,
                response_payload: result.responseCode ? JSON.stringify(result) : null,
              });

              await idempotencyService.updateIdempotencyStatus(idempotencyKey, 'completed');

              await marketplaceService.logExecution(
                workspaceId,
                workspaceIntegration.id,
                adapterType,
                'success',
                executionTime,
                null,
                payload,
                result.responseCode ? JSON.stringify(result) : null
              );

              dispatched++;
            } else if (result.status === 'skipped') {
              await executionContextService.updateExecutionContext(executionId, {
                status: 'skipped',
                error_message: result.reason || 'Adapter skipped',
                execution_time_ms: executionTime,
              });

              await idempotencyService.updateIdempotencyStatus(idempotencyKey, 'skipped');

              skipped++;
            } else {
              // ===== STEP 9: Error Handling =====
              await circuitBreakerService.recordFailure(
                workspaceIntegration.id,
                result.reason || 'Adapter error'
              );

              await executionContextService.updateExecutionContext(executionId, {
                status: 'failed',
                error_message: result.reason || 'Adapter error',
                execution_time_ms: executionTime,
                response_payload: result.responseCode ? JSON.stringify(result) : null,
              });

              await idempotencyService.updateIdempotencyStatus(idempotencyKey, 'failed');

              await marketplaceService.logExecution(
                workspaceId,
                workspaceIntegration.id,
                adapterType,
                'failed',
                executionTime,
                result.reason || 'Adapter error',
                payload,
                result.responseCode ? JSON.stringify(result) : null
              );

              failed++;
            }
          } catch (error) {
            const executionTime = startTime ? Date.now() - startTime : 0;
            logger.error(`Error executing adapter ${adapterName}:`, error.message);

            // ===== STEP 9: Error Handling =====
            if (executionId) {
              try {
                await executionContextService.updateExecutionContext(executionId, {
                  status: 'failed',
                  error_message: error.message,
                  execution_time_ms: executionTime,
                });
              } catch (updateError) {
                logger.error(`Failed to update execution context: ${updateError.message}`);
              }
            }

            if (idempotencyKey) {
              try {
                await idempotencyService.updateIdempotencyStatus(idempotencyKey, 'failed');
              } catch (idempotencyError) {
                logger.warn(`Failed to update idempotency status: ${idempotencyError.message}`);
              }
            }

            failed++;
          }
        })
        .catch(error => {
          logger.error(`Unhandled error in integration dispatch:`, error.message);
          failed++;
        });
    });

    return { dispatched, failed, skipped };
  }

  /**
   * Get integration logs
   * @param {string} workspaceId - Workspace ID
   * @param {Object} filters - Optional filters {adapter_name, event_type, status}
   * @returns {Promise<Object>} - Logs {logs, total, limit, offset}
   */
  async getIntegrationLogs(workspaceId, filters = {}) {
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    let filterString = `workspace_id="${workspaceId}"`;

    if (filters.adapter_name) {
      filterString += ` && adapter_name="${filters.adapter_name}"`;
    }

    if (filters.event_type) {
      filterString += ` && event_type="${filters.event_type}"`;
    }

    if (filters.status) {
      filterString += ` && status="${filters.status}"`;
    }

    const result = await pb.collection('integration_logs').getList(1, 50, {
      filter: filterString,
      sort: '-created',
    });

    return {
      logs: result.items,
      total: result.totalItems,
      limit: result.perPage,
      offset: 0,
    };
  }
}
