
import { ExecutionContext, RateLimitConfig, RateLimitWindow } from './governance.types';
import { RateLimitExceededError } from './governance.errors';

export class RateLimitService {
  private concurrentExecutions: Map<string, number> = new Map();

  constructor(private db: any) {}

  getWindowStart(window: RateLimitWindow, timestamp: Date = new Date()): Date {
    const d = new Date(timestamp);
    d.setMilliseconds(0);
    d.setSeconds(0);
    if (window === 'minute') return d;
    d.setMinutes(0);
    if (window === 'hour') return d;
    d.setHours(0);
    if (window === 'day') return d;
    d.setDate(1);
    return d;
  }

  getRetryAfter(window: RateLimitWindow, timestamp: Date = new Date()): number {
    const now = timestamp.getTime();
    const start = this.getWindowStart(window, timestamp).getTime();
    let end = start;
    if (window === 'minute') end += 60 * 1000;
    if (window === 'hour') end += 60 * 60 * 1000;
    if (window === 'day') end += 24 * 60 * 60 * 1000;
    if (window === 'month') {
      const d = new Date(start);
      d.setMonth(d.getMonth() + 1);
      end = d.getTime();
    }
    return Math.max(1, Math.ceil((end - now) / 1000));
  }

  async getCounterRecord(scopeId: string, window: RateLimitWindow, windowStart: Date) {
    try {
      const records = await this.db.collection('execution_counters').getFullList({
        filter: `scope_id="${scopeId}" && window="${window}" && window_start="${windowStart.toISOString()}"`,
        $autoCancel: false
      });
      return records.length > 0 ? records[0] : null;
    } catch (e) {
      return null;
    }
  }

  async checkAndIncrementRateLimit(context: ExecutionContext, config: RateLimitConfig): Promise<void> {
    const concurrent = this.concurrentExecutions.get(context.integrationId) || 0;
    if (concurrent >= config.maxConcurrent) {
      throw new RateLimitExceededError('Max concurrent executions reached', 5, 'integration', 'concurrent');
    }

    const windows: RateLimitWindow[] = ['minute', 'hour', 'day'];
    const limits = {
      minute: config.maxPerMinute,
      hour: config.maxPerHour,
      day: config.maxPerDay
    };

    for (const window of windows) {
      const limit = limits[window as keyof typeof limits];
      const windowStart = this.getWindowStart(window, context.timestamp);
      
      let record = await this.getCounterRecord(context.integrationId, window, windowStart);
      
      if (record && record.count >= limit) {
        throw new RateLimitExceededError(`Max executions per ${window} reached`, this.getRetryAfter(window, context.timestamp), 'integration', window);
      }

      try {
        if (record) {
          await this.db.collection('execution_counters').update(record.id, {
            count: record.count + 1
          }, { $autoCancel: false });
        } else {
          await this.db.collection('execution_counters').create({
            scope_type: 'integration',
            scope_id: context.integrationId,
            window: window,
            count: 1,
            window_start: windowStart.toISOString()
          }, { $autoCancel: false });
        }
      } catch (e) {
        // Fail-open on DB errors during increment
        console.warn(`Failed to increment rate limit counter for ${window}:`, e);
      }
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
}
