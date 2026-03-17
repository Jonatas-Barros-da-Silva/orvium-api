
import { ExecutionContext, AbuseFlag, AbuseReason } from './governance.types';
import { AbuseDetectedError } from './governance.errors';

export class AbuseDetectionService {
  private executionHistory: Map<string, Date[]> = new Map();
  private failureHistory: Map<string, Date[]> = new Map();

  constructor(private db: any) {}

  async checkAbuse(context: ExecutionContext): Promise<void> {
    const flag = await this.getAbuseFlag(context.integrationId);
    if (flag && flag.blockedUntil > new Date()) {
      const retryAfter = Math.ceil((flag.blockedUntil.getTime() - Date.now()) / 1000);
      throw new AbuseDetectedError(flag.reason, retryAfter);
    }

    const now = context.timestamp || new Date();
    const history = this.executionHistory.get(context.integrationId) || [];
    history.push(now);

    const oneMinAgo = new Date(now.getTime() - 60000);
    const recentHistory = history.filter(t => t > oneMinAgo);
    this.executionHistory.set(context.integrationId, recentHistory);

    if (this.detectExecutionLoop(recentHistory)) {
      await this.blockIntegration(context.integrationId, 'execution_loop', 300);
      throw new AbuseDetectedError('execution_loop', 300);
    }

    if (this.detectBurst(recentHistory, now)) {
      await this.blockIntegration(context.integrationId, 'burst_detected', 60);
      throw new AbuseDetectedError('burst_detected', 60);
    }
  }

  detectExecutionLoop(recentHistory: Date[]): boolean {
    return recentHistory.length > 100;
  }

  detectBurst(recentHistory: Date[], now: Date): boolean {
    const fiveSecAgo = new Date(now.getTime() - 5000);
    const burstHistory = recentHistory.filter(t => t > fiveSecAgo);
    return burstHistory.length > 50;
  }

  async recordFailure(context: ExecutionContext): Promise<void> {
    const now = new Date();
    const history = this.failureHistory.get(context.integrationId) || [];
    history.push(now);
    
    const oneMinAgo = new Date(now.getTime() - 60000);
    const recentHistory = history.filter(t => t > oneMinAgo);
    this.failureHistory.set(context.integrationId, recentHistory);
    
    if (this.detectFailureStorm(recentHistory)) {
      await this.blockIntegration(context.integrationId, 'failure_storm', 600);
    }
  }

  detectFailureStorm(recentHistory: Date[]): boolean {
    return recentHistory.length > 1000;
  }

  async blockIntegration(integrationId: string, reason: AbuseReason, durationSeconds: number): Promise<void> {
    const blockedUntil = new Date(Date.now() + durationSeconds * 1000);
    try {
      if (this.db && this.db.collection) {
        await this.db.collection('integration_abuse_flags').create({
          integration_version_id: integrationId,
          reason,
          blocked_until: blockedUntil.toISOString()
        }, { $autoCancel: false });
      }
    } catch (e) {
      console.error('Failed to persist abuse flag', e);
    }
  }

  async getAbuseFlag(integrationId: string): Promise<AbuseFlag | null> {
    try {
      if (this.db && this.db.collection) {
        const records = await this.db.collection('integration_abuse_flags').getFullList({
          filter: `integration_version_id="${integrationId}" && blocked_until > "${new Date().toISOString()}"`,
          sort: '-created',
          $autoCancel: false
        });
        
        if (records.length > 0) {
          return {
            integrationId: records[0].integration_version_id,
            reason: records[0].reason as AbuseReason,
            blockedUntil: new Date(records[0].blocked_until)
          };
        }
      }
    } catch (e) {
      // Ignore errors if collection doesn't exist yet
    }
    return null;
  }
}
