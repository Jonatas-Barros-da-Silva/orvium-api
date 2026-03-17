
import { GovernanceEngine } from '../../../../packages/governance/src/governance.engine.js';
import { GovernanceRejectedError, GovernanceInternalError } from '../../../../packages/governance/src/governance.errors.js';
import { ExecutionContext } from '../../../../packages/governance/src/governance.types.js';

export class AutomationEngine {
  private governanceEngine: GovernanceEngine;

  constructor(private pb: any, private jobQueue: any) {
    this.governanceEngine = new GovernanceEngine(pb);
  }

  async executeIntegration(context: ExecutionContext, payload: any): Promise<void> {
    try {
      await this.governanceEngine.validateExecution(context);
    } catch (error) {
      if (error instanceof GovernanceRejectedError) {
        // Fail-closed: Reject execution
        throw error;
      }
      if (error instanceof GovernanceInternalError) {
        // Fail-open: Log warning and allow execution
        console.warn('Governance check failed internally, allowing execution:', error.message);
      } else {
        throw error;
      }
    }

    // Push to job queue for worker runtime
    await this.jobQueue.push({
      context,
      payload,
      queuedAt: new Date().toISOString()
    });
  }

  async executeFromTrigger(integrationId: string, workspaceId: string, payload: any): Promise<void> {
    const context: ExecutionContext = {
      integrationId,
      workspaceId,
      developerId: 'system',
      action: 'trigger',
      timestamp: new Date()
    };
    await this.executeIntegration(context, payload);
  }

  async executeFromWebhook(integrationId: string, workspaceId: string, payload: any): Promise<void> {
    const context: ExecutionContext = {
      integrationId,
      workspaceId,
      developerId: 'system',
      action: 'webhook',
      timestamp: new Date()
    };
    await this.executeIntegration(context, payload);
  }

  async executeFromSchedule(integrationId: string, workspaceId: string, payload: any): Promise<void> {
    const context: ExecutionContext = {
      integrationId,
      workspaceId,
      developerId: 'system',
      action: 'schedule',
      timestamp: new Date()
    };
    await this.executeIntegration(context, payload);
  }

  async executeFromAPI(integrationId: string, workspaceId: string, developerId: string, payload: any): Promise<void> {
    const context: ExecutionContext = {
      integrationId,
      workspaceId,
      developerId,
      action: 'api',
      timestamp: new Date()
    };
    await this.executeIntegration(context, payload);
  }

  async executeFromRetry(integrationId: string, workspaceId: string, payload: any): Promise<void> {
    const context: ExecutionContext = {
      integrationId,
      workspaceId,
      developerId: 'system',
      action: 'retry',
      timestamp: new Date()
    };
    await this.executeIntegration(context, payload);
  }
}

export function createAutomationEngine(pb: any, jobQueue: any): AutomationEngine {
  return new AutomationEngine(pb, jobQueue);
}
