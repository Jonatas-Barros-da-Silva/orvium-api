
import { ExecutionContext, RateLimitConfig, GovernanceResult } from './governance.types';

export class RateLimitService {
  private counters: Map<string, number> = new Map();
  private concurrentExecutions: Map<string, number> = new Map();

  constructor(private db: any) {}

  private getWindowKey(context: ExecutionContext, window: string): string {
    const now = context.timestamp || new Date();
    let timeKey = '';
    if (window === 'minute') timeKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    if (window === 'hour') timeKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    if (window === 'day') timeKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    return `${context.integrationId}:${window}:${timeKey}`;
  }

  async checkRateLimit(context: ExecutionContext, config: RateLimitConfig): Promise<GovernanceResult> {
    const minKey = this.getWindowKey(context, 'minute');
    const hourKey = this.getWindowKey(context, 'hour');
    const dayKey = this.getWindowKey(context, 'day');

    const minCount = this.counters.get(minKey) || 0;
    const hourCount = this.counters.get(hourKey) || 0;
    const dayCount = this.counters.get(dayKey) || 0;
    const concurrent = this.concurrentExecutions.get(context.integrationId) || 0;

    if (concurrent >= config.maxConcurrent) {
      return { allowed: false, reason: 'Rate limit exceeded: max concurrent executions', retryAfter: 5 };
    }
    if (minCount >= config.maxPerMinute) {
      return { allowed: false, reason: 'Rate limit exceeded: max per minute', retryAfter: 60 };
    }
    if (hourCount >= config.maxPerHour) {
      return { allowed: false, reason: 'Rate limit exceeded: max per hour', retryAfter: 3600 };
    }
    if (dayCount >= config.maxPerDay) {
      return { allowed: false, reason: 'Rate limit exceeded: max per day', retryAfter: 86400 };
    }

    return { 
      allowed: true, 
      metrics: { currentMinute: minCount, currentHour: hourCount, currentDay: dayCount, concurrent } 
    };
  }

  async incrementCounter(context: ExecutionContext): Promise<void> {
    const minKey = this.getWindowKey(context, 'minute');
    const hourKey = this.getWindowKey(context, 'hour');
    const dayKey = this.getWindowKey(context, 'day');

    this.counters.set(minKey, (this.counters.get(minKey) || 0) + 1);
    this.counters.set(hourKey, (this.counters.get(hourKey) || 0) + 1);
    this.counters.set(dayKey, (this.counters.get(dayKey) || 0) + 1);

    // In a production environment, we would persist these to the execution_counters collection
    // For performance, we batch these updates or rely on Redis.
    
    // Cleanup old keys periodically (1% chance on increment)
    if (Math.random() < 0.01) {
      this.cleanupOldCounters();
    }
  }

  incrementConcurrent(integrationId: string): void {
    this.concurrentExecutions.set(integrationId, (this.concurrentExecutions.get(integrationId) || 0) + 1);
  }

  decrementConcurrent(integrationId: string): void {
    const current = this.concurrentExecutions.get(integrationId) || 0;
    if (current > 0) {
      this.concurrentExecutions.set(integrationId, current - 1);
    }
  }

  private cleanupOldCounters() {
    // Simplified cleanup logic
    const now = new Date();
    const currentMinKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    
    for (const key of this.counters.keys()) {
      if (key.includes(':minute:') && !key.endsWith(currentMinKey)) {
        this.counters.delete(key);
      }
    }
  }
}
