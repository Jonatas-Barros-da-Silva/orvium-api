
import { ExecutionContext, QuotaConfig } from './governance.types';
import { QuotaExceededError } from './governance.errors';

export class QuotaService {
  constructor(private db: any) {}

  async checkQuota(context: ExecutionContext, config: QuotaConfig): Promise<void> {
    const monthly = await this.getMonthlyExecutionCount(context);
    const daily = await this.getDailyExecutionCount(context);
    const concurrent = await this.getConcurrentExecutionCount(context);

    if (monthly >= config.maxExecutionsPerMonth) {
      throw new QuotaExceededError('Max executions per month reached', 'workspace', 'monthly');
    }
    if (daily >= config.maxExecutionsPerDay) {
      throw new QuotaExceededError('Max executions per day reached', 'workspace', 'daily');
    }
    if (concurrent >= config.maxConcurrentExecutions) {
      throw new QuotaExceededError('Max concurrent executions reached', 'workspace', 'concurrent');
    }
  }

  async getMonthlyExecutionCount(context: ExecutionContext): Promise<number> {
    try {
      const now = context.timestamp || new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const records = await this.db.collection('integration_executions').getList(1, 1, {
        filter: `workspace_id="${context.workspaceId}" && created >= "${startOfMonth}"`,
        $autoCancel: false
      });
      return records.totalItems || 0;
    } catch (e) {
      return 0; // Fail-open
    }
  }

  async getDailyExecutionCount(context: ExecutionContext): Promise<number> {
    try {
      const now = context.timestamp || new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const records = await this.db.collection('integration_executions').getList(1, 1, {
        filter: `workspace_id="${context.workspaceId}" && created >= "${startOfDay}"`,
        $autoCancel: false
      });
      return records.totalItems || 0;
    } catch (e) {
      return 0; // Fail-open
    }
  }

  async getConcurrentExecutionCount(context: ExecutionContext): Promise<number> {
    try {
      const records = await this.db.collection('integration_executions').getList(1, 1, {
        filter: `workspace_id="${context.workspaceId}" && status="running"`,
        $autoCancel: false
      });
      return records.totalItems || 0;
    } catch (e) {
      return 0; // Fail-open
    }
  }
}
