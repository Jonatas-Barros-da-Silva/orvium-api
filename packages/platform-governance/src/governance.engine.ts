
import { ExecutionContext, GovernanceResult, RateLimitConfig, QuotaConfig } from './governance.types';
import { RateLimitService } from './rate-limit.service';
import { QuotaService } from './quota.service';
import { AbuseDetectionService } from './abuse-detection.service';

export class GovernanceEngine {
  private rateLimitService: RateLimitService;
  private quotaService: QuotaService;
  private abuseDetectionService: AbuseDetectionService;

  constructor(db: any) {
    this.rateLimitService = new RateLimitService(db);
    this.quotaService = new QuotaService(db);
    this.abuseDetectionService = new AbuseDetectionService(db);
  }

  async validateExecution(context: ExecutionContext): Promise<GovernanceResult> {
    // 1. Abuse Detection Check
    const abuseResult = await this.abuseDetectionService.checkAbuse(context);
    if (!abuseResult.allowed) return abuseResult;

    // 2. Rate Limit Check
    const rlConfig = await this.getRateLimitConfig(context);
    const rlResult = await this.rateLimitService.checkRateLimit(context, rlConfig);
    if (!rlResult.allowed) return rlResult;

    // 3. Quota Check
    const quotaConfig = await this.getQuotaConfig(context);
    const quotaResult = await this.quotaService.checkQuota(context, quotaConfig);
    if (!quotaResult.allowed) return quotaResult;

    // 4. Increment Counters
    await this.rateLimitService.incrementCounter(context);

    return { allowed: true, metrics: rlResult.metrics };
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
    // In a real implementation, fetch from integration_rate_limits collection
    return { 
      maxPerMinute: 100, 
      maxPerHour: 5000, 
      maxPerDay: 100000, 
      maxConcurrent: 10 
    };
  }

  async getQuotaConfig(context: ExecutionContext): Promise<QuotaConfig> {
    // In a real implementation, fetch from workspace_rate_limits collection
    return { 
      maxExecutionsPerMonth: 1000000, 
      maxExecutionsPerDay: 100000, 
      maxConcurrentExecutions: 100 
    };
  }
}
