
import { ExecutionContext, RateLimitConfig, QuotaConfig } from './governance.types';
import { RateLimitService } from './rate-limit.service';
import { QuotaService } from './quota.service';
import { AbuseDetectionService } from './abuse-detection.service';
import { GovernanceRejectedError, GovernanceInternalError } from './governance.errors';

export class GovernanceEngine {
  private rateLimitService: RateLimitService;
  private quotaService: QuotaService;
  private abuseDetectionService: AbuseDetectionService;

  constructor(private db: any) {
    this.rateLimitService = new RateLimitService(db);
    this.quotaService = new QuotaService(db);
    this.abuseDetectionService = new AbuseDetectionService(db);
  }

  async validateExecution(context: ExecutionContext): Promise<void> {
    try {
      // 1. Abuse Detection Check
      await this.abuseDetectionService.checkAbuse(context);

      // 2. Rate Limit Check
      const rlConfig = await this.getRateLimitConfig(context);
      await this.rateLimitService.checkAndIncrementRateLimit(context, rlConfig);

      // 3. Quota Check
      const quotaConfig = await this.getQuotaConfig(context);
      await this.quotaService.checkQuota(context, quotaConfig);

    } catch (error) {
      if (error instanceof GovernanceRejectedError) {
        throw error; // Fail-closed for legitimate governance rejections
      }
      // Fail-open for internal errors (DB down, etc.)
      console.warn('Governance internal failure, failing open:', error);
      throw new GovernanceInternalError(error instanceof Error ? error.message : 'Unknown error', error);
    }
  }

  async recordExecutionStart(context: ExecutionContext): Promise<void> {
    this.rateLimitService.incrementConcurrent(context.integrationId);
  }

  async recordExecutionEnd(context: ExecutionContext, failed: boolean = false): Promise<void> {
    this.rateLimitService.decrementConcurrent(context.integrationId);
    if (failed) {
      await this.abuseDetectionService.recordFailure(context);
    }
  }

  async getRateLimitConfig(context: ExecutionContext): Promise<RateLimitConfig> {
    try {
      const records = await this.db.collection('integration_rate_limits').getFullList({
        filter: `integration_version_id="${context.integrationId}"`,
        $autoCancel: false
      });
      if (records.length > 0) {
        return {
          maxPerMinute: records[0].max_per_minute || 100,
          maxPerHour: records[0].max_per_hour || 5000,
          maxPerDay: records[0].max_per_day || 100000,
          maxConcurrent: records[0].max_concurrent || 10
        };
      }
    } catch (e) {
      // Ignore and use defaults
    }
    return { maxPerMinute: 100, maxPerHour: 5000, maxPerDay: 100000, maxConcurrent: 10 };
  }

  async getQuotaConfig(context: ExecutionContext): Promise<QuotaConfig> {
    try {
      const records = await this.db.collection('workspace_rate_limits').getFullList({
        filter: `workspace_id="${context.workspaceId}"`,
        $autoCancel: false
      });
      if (records.length > 0) {
        return {
          maxExecutionsPerMonth: records[0].max_executions_per_month || 1000000,
          maxExecutionsPerDay: records[0].max_executions_per_day || 100000,
          maxConcurrentExecutions: records[0].max_concurrent_executions || 100
        };
      }
    } catch (e) {
      // Ignore and use defaults
    }
    return { maxExecutionsPerMonth: 1000000, maxExecutionsPerDay: 100000, maxConcurrentExecutions: 100 };
  }
}
